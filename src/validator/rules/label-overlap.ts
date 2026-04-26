import { rectsOverlap, rectContains, overlapArea } from "../../utils/geometry.js";
import type { Rect } from "../../utils/geometry.js";
import type { DiagramData, ValidationIssue } from "../types.js";
import { isContainerShape, formatElement } from "../types.js";

// Label bounds in BPMN DI are often larger than the actual rendered text.
// Shrink them before overlap checks to reduce false positives.
const LABEL_SHRINK = 5;

// Minimum overlap area to report — filters out trivial edge-touching
const MIN_OVERLAP_AREA = 100;

interface LabelInfo {
  ownerId: string;
  ownerName?: string;
  ownerType: string;
  bounds: Rect;
}

function shrinkRect(r: Rect): Rect {
  return {
    x: r.x + LABEL_SHRINK,
    y: r.y + LABEL_SHRINK,
    width: Math.max(0, r.width - LABEL_SHRINK * 2),
    height: Math.max(0, r.height - LABEL_SHRINK * 2),
  };
}

export function checkLabelOverlap(data: DiagramData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const labels: LabelInfo[] = [];

  for (const shape of data.shapes) {
    if (shape.labelBounds) {
      labels.push({
        ownerId: shape.id,
        ownerName: shape.name,
        ownerType: shape.elementType,
        bounds: shape.labelBounds,
      });
    }
  }

  for (const edge of data.edges) {
    if (edge.labelBounds) {
      labels.push({
        ownerId: edge.id,
        ownerName: edge.name,
        ownerType: edge.elementType,
        bounds: edge.labelBounds,
      });
    }
  }

  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i];
      const b = labels[j];
      const shrunkA = shrinkRect(a.bounds);
      const shrunkB = shrinkRect(b.bounds);

      if (rectsOverlap(shrunkA, shrunkB) && overlapArea(shrunkA, shrunkB) >= MIN_OVERLAP_AREA) {
        issues.push({
          type: "label_overlap",
          severity: "warning",
          message: `Labels of ${formatElement(a.ownerId, a.ownerName, a.ownerType)} and ${formatElement(b.ownerId, b.ownerName, b.ownerType)} overlap`,
          elementIds: [a.ownerId, b.ownerId],
          details: { overlapArea: Math.round(overlapArea(shrunkA, shrunkB)) },
        });
      }
    }
  }

  for (const label of labels) {
    const shrunkLabel = shrinkRect(label.bounds);

    for (const shape of data.shapes) {
      if (shape.id === label.ownerId) continue;

      // Skip: label inside a container (Participant, Lane, etc.) — this is normal
      if (isContainerShape(shape) && rectContains(shape.bounds, label.bounds)) continue;

      if (rectsOverlap(shrunkLabel, shape.bounds) && overlapArea(shrunkLabel, shape.bounds) >= MIN_OVERLAP_AREA) {
        issues.push({
          type: "label_overlap",
          severity: "warning",
          message: `Label of ${formatElement(label.ownerId, label.ownerName, label.ownerType)} overlaps with element ${formatElement(shape.id, shape.name, shape.elementType)}`,
          elementIds: [label.ownerId, shape.id],
          details: { overlapArea: Math.round(overlapArea(shrunkLabel, shape.bounds)) },
        });
      }
    }
  }

  return issues;
}

import { rectsOverlap, overlapArea, rectContains } from "../../utils/geometry.js";
import type { DiagramData, ValidationIssue, Thresholds } from "../types.js";
import { isContainerShape, formatElement } from "../types.js";

// Minimum overlap area to report — filters out trivial edge-touching
// caused by imprecise DI bounds (e.g. labels extending beyond shapes)
const MIN_OVERLAP_AREA = 50;

export function checkOverlap(data: DiagramData, thresholds: Thresholds): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { shapes } = data;

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i];
      const b = shapes[j];

      if (shouldSkipPair(a, b)) continue;

      if (rectsOverlap(a.bounds, b.bounds, thresholds.overlapTolerance)) {
        const area = overlapArea(a.bounds, b.bounds);
        if (area < MIN_OVERLAP_AREA) continue;

        issues.push({
          type: "overlap",
          severity: "error",
          message: `Elements ${formatElement(a.id, a.name, a.elementType)} and ${formatElement(b.id, b.name, b.elementType)} overlap by ${Math.round(area)}px²`,
          elementIds: [a.id, b.id],
          details: { overlapArea: Math.round(area) },
        });
      }
    }
  }

  return issues;
}

function shouldSkipPair(
  a: { id: string; elementType: string; bounds: { x: number; y: number; width: number; height: number }; isExpanded?: boolean; attachedToRef?: string },
  b: { id: string; elementType: string; bounds: { x: number; y: number; width: number; height: number }; isExpanded?: boolean; attachedToRef?: string },
): boolean {
  // BoundaryEvent on its host activity
  if (a.elementType === "bpmn:BoundaryEvent" && a.attachedToRef === b.id) return true;
  if (b.elementType === "bpmn:BoundaryEvent" && b.attachedToRef === a.id) return true;

  // Two BoundaryEvents on the same host — they naturally sit close together
  if (a.elementType === "bpmn:BoundaryEvent" && b.elementType === "bpmn:BoundaryEvent" &&
      a.attachedToRef && a.attachedToRef === b.attachedToRef) return true;

  // Container with its children
  const aContainer = isContainerShape(a as any);
  const bContainer = isContainerShape(b as any);

  if (aContainer && rectContains(a.bounds, b.bounds)) return true;
  if (bContainer && rectContains(b.bounds, a.bounds)) return true;

  return false;
}

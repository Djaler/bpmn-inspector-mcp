import { minGap, rectContains } from "../../utils/geometry.js";
import type { DiagramData, ValidationIssue, Thresholds } from "../types.js";
import { isContainerShape, formatElement } from "../types.js";

export function checkSpacing(data: DiagramData, thresholds: Thresholds): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { shapes } = data;

  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      const a = shapes[i];
      const b = shapes[j];

      if (shouldSkipPair(a, b)) continue;

      const gap = minGap(a.bounds, b.bounds);
      if (gap > 0 && gap < thresholds.minSpacing) {
        issues.push({
          type: "too_close",
          severity: "warning",
          message: `Elements ${formatElement(a.id, a.name, a.elementType)} and ${formatElement(b.id, b.name, b.elementType)} are ${Math.round(gap)}px apart (minimum: ${thresholds.minSpacing}px)`,
          elementIds: [a.id, b.id],
          details: { distance: Math.round(gap), threshold: thresholds.minSpacing },
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
  if (a.elementType === "bpmn:BoundaryEvent" && a.attachedToRef === b.id) return true;
  if (b.elementType === "bpmn:BoundaryEvent" && b.attachedToRef === a.id) return true;

  // Two BoundaryEvents on the same host — they naturally sit close together
  if (a.elementType === "bpmn:BoundaryEvent" && b.elementType === "bpmn:BoundaryEvent" &&
      a.attachedToRef && a.attachedToRef === b.attachedToRef) return true;

  const aContainer = isContainerShape(a as any);
  const bContainer = isContainerShape(b as any);

  if (aContainer && rectContains(a.bounds, b.bounds)) return true;
  if (bContainer && rectContains(b.bounds, a.bounds)) return true;

  // Participant-to-Participant spacing is controlled by the modeler, not by users
  if (a.elementType === "bpmn:Participant" && b.elementType === "bpmn:Participant") return true;

  return false;
}

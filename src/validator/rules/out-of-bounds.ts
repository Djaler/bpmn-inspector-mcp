import { rectContains } from "../../utils/geometry.js";
import type { DiagramData, ValidationIssue } from "../types.js";
import { isContainerShape, formatElement } from "../types.js";

export function checkOutOfBounds(data: DiagramData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const containers = data.shapes.filter(s => isContainerShape(s));

  for (const shape of data.shapes) {
    const { x, y } = shape.bounds;

    // Skip elements that are inside a container — they are bounded by the container, not the canvas
    const insideContainer = containers.some(
      c => c.id !== shape.id && rectContains(c.bounds, shape.bounds),
    );
    if (insideContainer) continue;

    if (x < 0 || y < 0) {
      issues.push({
        type: "out_of_bounds",
        severity: "warning",
        message: `Element ${formatElement(shape.id, shape.name, shape.elementType)} is at negative position (${Math.round(x)}, ${Math.round(y)})`,
        elementIds: [shape.id],
        details: { x: Math.round(x), y: Math.round(y) },
      });
    }
  }

  return issues;
}
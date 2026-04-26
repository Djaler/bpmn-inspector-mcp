import type { DiagramData, ValidationIssue, Thresholds } from "../types.js";
import { isContainerShape, formatElement } from "../types.js";

export function checkExcessiveGap(data: DiagramData, thresholds: Thresholds): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { shapes, edges } = data;

  const shapeById = new Map(shapes.map(s => [s.id, s]));
  const nonContainerShapes = shapes.filter(s => !isContainerShape(s));

  for (const edge of edges) {
    if (edge.elementType !== "bpmn:SequenceFlow") continue;
    if (!edge.sourceRef || !edge.targetRef) continue;

    const source = shapeById.get(edge.sourceRef);
    const target = shapeById.get(edge.targetRef);
    if (!source || !target) continue;

    const sourceRight = source.bounds.x + source.bounds.width;
    const targetLeft = target.bounds.x;
    const gap = targetLeft - sourceRight;

    if (gap < thresholds.maxGap) continue;

    const corridorLeft = sourceRight;
    const corridorRight = targetLeft;
    const corridorTop = Math.min(source.bounds.y, target.bounds.y);
    const corridorBottom = Math.max(
      source.bounds.y + source.bounds.height,
      target.bounds.y + target.bounds.height,
    );

    const hasElementsInCorridor = nonContainerShapes.some(s => {
      if (s.id === source.id || s.id === target.id) return false;
      const centerX = s.bounds.x + s.bounds.width / 2;
      const centerY = s.bounds.y + s.bounds.height / 2;
      return (
        centerX > corridorLeft &&
        centerX < corridorRight &&
        centerY > corridorTop &&
        centerY < corridorBottom
      );
    });

    if (!hasElementsInCorridor) {
      issues.push({
        type: "excessive_gap",
        severity: "warning",
        message: `Excessive gap (${Math.round(gap)}px) between connected elements ${formatElement(source.id, source.name, source.elementType)} and ${formatElement(target.id, target.name, target.elementType)} with no elements in between — possible leftover from removed step`,
        elementIds: [source.id, target.id],
        details: { gap: Math.round(gap), threshold: thresholds.maxGap },
      });
    }
  }

  return issues;
}

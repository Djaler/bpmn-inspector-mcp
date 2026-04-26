import { segmentIntersectsRect, rectContains } from "../../utils/geometry.js";
import type { DiagramData, ValidationIssue } from "../types.js";
import { isContainerShape, formatElement } from "../types.js";

const SKIP_CROSSING_TYPES = new Set([
  "bpmn:Participant",
  "bpmn:Lane",
  "bpmn:Group",
]);

export function checkFlowCrossing(data: DiagramData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { shapes, edges } = data;

  const containers = shapes.filter(s => isContainerShape(s));

  for (const edge of edges) {
    const skipIds = new Set<string>();
    if (edge.sourceRef) skipIds.add(edge.sourceRef);
    if (edge.targetRef) skipIds.add(edge.targetRef);

    for (const shape of shapes) {
      if (skipIds.has(shape.id)) continue;

      // Skip Participants, Lanes, Groups — flows inside them always intersect their bounds
      if (SKIP_CROSSING_TYPES.has(shape.elementType)) continue;

      // Skip expanded SubProcesses if the flow source or target is inside them
      if (shape.elementType === "bpmn:SubProcess" && shape.isExpanded) {
        const sourceShape = edge.sourceRef ? shapes.find(s => s.id === edge.sourceRef) : undefined;
        const targetShape = edge.targetRef ? shapes.find(s => s.id === edge.targetRef) : undefined;
        const sourceInside = sourceShape && rectContains(shape.bounds, sourceShape.bounds);
        const targetInside = targetShape && rectContains(shape.bounds, targetShape.bounds);
        if (sourceInside || targetInside) continue;
      }

      // Skip if the shape is a container that contains the flow's source or target
      // (e.g., text annotation inside a pool — the association from it naturally crosses the pool)

      let crossesContainer = false;
      for (const container of containers) {
        if (container.id === shape.id) continue;
        if (rectContains(container.bounds, shape.bounds)) {
          // shape is inside a container — skip checking flows that also belong to this container
          const sourceShape = edge.sourceRef ? shapes.find(s => s.id === edge.sourceRef) : undefined;
          const targetShape = edge.targetRef ? shapes.find(s => s.id === edge.targetRef) : undefined;
          if (sourceShape && rectContains(container.bounds, sourceShape.bounds)) {
            crossesContainer = true;
            break;
          }
          if (targetShape && rectContains(container.bounds, targetShape.bounds)) {
            crossesContainer = true;
            break;
          }
        }
      }
      if (crossesContainer) continue;

      for (let i = 0; i < edge.waypoints.length - 1; i++) {
        const p1 = edge.waypoints[i];
        const p2 = edge.waypoints[i + 1];

        if (segmentIntersectsRect(p1, p2, shape.bounds)) {
          issues.push({
            type: "flow_crossing",
            severity: "warning",
            message: `Flow ${formatElement(edge.id, edge.name, edge.elementType)} crosses through element ${formatElement(shape.id, shape.name, shape.elementType)}`,
            elementIds: [edge.id, shape.id],
            details: {
              flowType: edge.elementType,
              crossedElement: shape.id,
            },
          });
          break;
        }
      }
    }
  }

  return issues;
}

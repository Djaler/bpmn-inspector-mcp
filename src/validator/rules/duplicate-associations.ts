import type { DiagramData, ValidationIssue } from "../types.js";
import { formatElement } from "../types.js";

const CHECKABLE_EDGE_TYPES = new Set([
  "bpmn:DataInputAssociation",
  "bpmn:DataOutputAssociation",
  "bpmn:MessageFlow",
]);

export function checkDuplicateAssociations(data: DiagramData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const groups = new Map<string, string[]>();

  for (const edge of data.edges) {
    if (!CHECKABLE_EDGE_TYPES.has(edge.elementType)) continue;
    if (!edge.sourceRef || !edge.targetRef) continue;

    const key = `${edge.sourceRef}->${edge.targetRef}`;
    const group = groups.get(key);
    if (group) {
      group.push(edge.id);
    } else {
      groups.set(key, [edge.id]);
    }
  }

  for (const [key, edgeIds] of groups) {
    if (edgeIds.length <= 1) continue;

    const [sourceId, targetId] = key.split("->");
    const sourceShape = data.shapes.find(s => s.id === sourceId);
    const targetShape = data.shapes.find(s => s.id === targetId);

    issues.push({
      type: "duplicate_connection",
      severity: "warning",
      message: `Duplicate connection: ${formatElement(sourceId, sourceShape?.name, sourceShape?.elementType ?? "unknown")} has ${edgeIds.length} flows to ${formatElement(targetId, targetShape?.name, targetShape?.elementType ?? "unknown")} (expected 1)`,
      elementIds: [sourceId, targetId],
      details: { count: edgeIds.length, edgeIds },
    });
  }

  return issues;
}

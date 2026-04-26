import type { DiagramShape, DiagramEdge, DiagramData } from "../src/validator/types.js";

let idCounter = 0;

export function resetIds(): void {
  idCounter = 0;
}

export function shape(overrides: Partial<DiagramShape> & { bounds: DiagramShape["bounds"] }): DiagramShape {
  idCounter++;
  return {
    id: `shape_${idCounter}`,
    elementType: "bpmn:Task",
    ...overrides,
  };
}

export function edge(overrides: Partial<DiagramEdge> & { waypoints: DiagramEdge["waypoints"] }): DiagramEdge {
  idCounter++;
  return {
    id: `edge_${idCounter}`,
    elementType: "bpmn:SequenceFlow",
    ...overrides,
  };
}

export function diagramData(shapes: DiagramShape[], edges: DiagramEdge[] = []): DiagramData {
  return { shapes, edges };
}

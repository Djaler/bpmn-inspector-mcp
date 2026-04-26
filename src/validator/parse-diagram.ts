import { BpmnModdle } from "bpmn-moddle";
import type { DiagramData, DiagramShape, DiagramEdge } from "./types.js";

interface ModdleBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ModdleWaypoint {
  x: number;
  y: number;
}

interface ModdleLabel {
  bounds?: ModdleBounds;
}

interface ModdleBpmnElement {
  id: string;
  name?: string;
  $type: string;
  text?: string;
  attachedToRef?: { id: string };
  sourceRef?: { id: string };
  targetRef?: { id: string };
}

interface ModdlePlaneElement {
  $type: string;
  bpmnElement: ModdleBpmnElement;
  bounds?: ModdleBounds;
  waypoint?: ModdleWaypoint[];
  isExpanded?: boolean;
  label?: ModdleLabel;
}

interface ModdlePlane {
  planeElement?: ModdlePlaneElement[];
}

interface ModdleDiagram {
  plane: ModdlePlane;
}

interface ModdleDefinitions {
  diagrams?: ModdleDiagram[];
}

export async function parseDiagram(xml: string): Promise<DiagramData> {
  const moddle = new BpmnModdle();
  const { rootElement } = await moddle.fromXML(xml) as { rootElement: ModdleDefinitions };

  const diagrams = rootElement.diagrams;
  if (!diagrams || diagrams.length === 0) {
    throw new Error("No diagrams found in BPMN file");
  }

  const shapes: DiagramShape[] = [];
  const edges: DiagramEdge[] = [];

  for (const diagram of diagrams) {
    const planeElements = diagram.plane.planeElement;
    if (!planeElements) continue;

    for (const el of planeElements) {
      if (el.$type === "bpmndi:BPMNShape" && el.bounds) {
        shapes.push({
          id: el.bpmnElement.id,
          name: el.bpmnElement.name ?? el.bpmnElement.text,
          elementType: el.bpmnElement.$type,
          bounds: {
            x: el.bounds.x,
            y: el.bounds.y,
            width: el.bounds.width,
            height: el.bounds.height,
          },
          isExpanded: el.isExpanded,
          attachedToRef: el.bpmnElement.attachedToRef?.id,
          labelBounds: el.label?.bounds ? {
            x: el.label.bounds.x,
            y: el.label.bounds.y,
            width: el.label.bounds.width,
            height: el.label.bounds.height,
          } : undefined,
        });
      } else if (el.$type === "bpmndi:BPMNEdge" && el.waypoint) {
        edges.push({
          id: el.bpmnElement.id,
          name: el.bpmnElement.name,
          elementType: el.bpmnElement.$type,
          waypoints: el.waypoint.map(wp => ({ x: wp.x, y: wp.y })),
          sourceRef: el.bpmnElement.sourceRef?.id,
          targetRef: el.bpmnElement.targetRef?.id,
          labelBounds: el.label?.bounds ? {
            x: el.label.bounds.x,
            y: el.label.bounds.y,
            width: el.label.bounds.width,
            height: el.label.bounds.height,
          } : undefined,
        });
      }
    }
  }

  return { shapes, edges };
}

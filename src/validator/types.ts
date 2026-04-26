import type { Rect, Point } from "../utils/geometry.js";

export interface DiagramShape {
  id: string;
  name?: string;
  elementType: string;
  bounds: Rect;
  isExpanded?: boolean;
  attachedToRef?: string;
  labelBounds?: Rect;
}

export interface DiagramEdge {
  id: string;
  name?: string;
  elementType: string;
  waypoints: Point[];
  sourceRef?: string;
  targetRef?: string;
  labelBounds?: Rect;
}

export interface DiagramData {
  shapes: DiagramShape[];
  edges: DiagramEdge[];
}

export type IssueSeverity = "error" | "warning";

export type IssueType =
  | "overlap"
  | "too_close"
  | "flow_crossing"
  | "out_of_bounds"
  | "label_overlap";

export interface ValidationIssue {
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  elementIds: string[];
  details: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  issueCount: number;
  issues: ValidationIssue[];
  summary: string;
}

export interface Thresholds {
  minSpacing: number;
  overlapTolerance: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  minSpacing: 30,
  overlapTolerance: 0,
};

const CONTAINER_TYPES = new Set([
  "bpmn:Participant",
  "bpmn:Lane",
  "bpmn:SubProcess",
  "bpmn:Group",
]);

export function isContainerType(elementType: string): boolean {
  return CONTAINER_TYPES.has(elementType);
}

export function formatElement(id: string, name: string | undefined, type: string): string {
  if (name) {
    const truncated = name.length > 50 ? name.slice(0, 50).replace(/\n/g, " ") + "…" : name.replace(/\n/g, " ");
    return `'${id}' «${truncated}» (${type})`;
  }
  return `'${id}' (${type})`;
}

export function isContainerShape(shape: DiagramShape): boolean {
  if (shape.elementType === "bpmn:SubProcess") {
    return shape.isExpanded === true;
  }
  return isContainerType(shape.elementType);
}

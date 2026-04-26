import { describe, it, expect, beforeEach } from "vitest";
import { resetIds, shape, edge, diagramData } from "../helpers.js";
import { checkExcessiveGap } from "../../src/validator/rules/excessive-gap.js";
import type { Thresholds } from "../../src/validator/types.js";
import { DEFAULT_THRESHOLDS } from "../../src/validator/types.js";

describe("checkExcessiveGap", () => {
  beforeEach(() => resetIds());

  it("returns no issues when gap is below threshold", () => {
    const src = shape({ id: "s1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const tgt = shape({ id: "s2", bounds: { x: 250, y: 100, width: 100, height: 80 } });
    const flow = edge({
      id: "f1",
      elementType: "bpmn:SequenceFlow",
      sourceRef: "s1",
      targetRef: "s2",
      waypoints: [{ x: 200, y: 140 }, { x: 250, y: 140 }],
    });
    const data = diagramData([src, tgt], [flow]);
    expect(checkExcessiveGap(data, DEFAULT_THRESHOLDS)).toHaveLength(0);
  });

  it("detects empty corridor between connected elements", () => {
    const src = shape({ id: "s1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const tgt = shape({ id: "s2", bounds: { x: 700, y: 100, width: 100, height: 80 } });
    const flow = edge({
      id: "f1",
      elementType: "bpmn:SequenceFlow",
      sourceRef: "s1",
      targetRef: "s2",
      waypoints: [{ x: 200, y: 140 }, { x: 700, y: 140 }],
    });
    const data = diagramData([src, tgt], [flow]);
    const issues = checkExcessiveGap(data, DEFAULT_THRESHOLDS);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("excessive_gap");
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].elementIds).toEqual(["s1", "s2"]);
    expect(issues[0].details.gap).toBe(500);
  });

  it("does not flag when elements exist in the corridor", () => {
    const src = shape({ id: "s1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const mid = shape({ id: "mid", bounds: { x: 400, y: 110, width: 100, height: 80 } });
    const tgt = shape({ id: "s2", bounds: { x: 700, y: 100, width: 100, height: 80 } });
    const flow = edge({
      id: "f1",
      elementType: "bpmn:SequenceFlow",
      sourceRef: "s1",
      targetRef: "s2",
      waypoints: [{ x: 200, y: 140 }, { x: 700, y: 140 }],
    });
    const data = diagramData([src, mid, tgt], [flow]);
    expect(checkExcessiveGap(data, DEFAULT_THRESHOLDS)).toHaveLength(0);
  });

  it("ignores containers when checking corridor occupancy", () => {
    const src = shape({ id: "s1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const participant = shape({
      id: "p1",
      elementType: "bpmn:Participant",
      bounds: { x: 50, y: 50, width: 800, height: 300 },
    });
    const tgt = shape({ id: "s2", bounds: { x: 700, y: 100, width: 100, height: 80 } });
    const flow = edge({
      id: "f1",
      elementType: "bpmn:SequenceFlow",
      sourceRef: "s1",
      targetRef: "s2",
      waypoints: [{ x: 200, y: 140 }, { x: 700, y: 140 }],
    });
    const data = diagramData([src, participant, tgt], [flow]);
    const issues = checkExcessiveGap(data, DEFAULT_THRESHOLDS);
    expect(issues).toHaveLength(1);
  });

  it("respects custom maxGap threshold", () => {
    const src = shape({ id: "s1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const tgt = shape({ id: "s2", bounds: { x: 700, y: 100, width: 100, height: 80 } });
    const flow = edge({
      id: "f1",
      elementType: "bpmn:SequenceFlow",
      sourceRef: "s1",
      targetRef: "s2",
      waypoints: [{ x: 200, y: 140 }, { x: 700, y: 140 }],
    });
    const data = diagramData([src, tgt], [flow]);
    const lenientThresholds: Thresholds = { ...DEFAULT_THRESHOLDS, maxGap: 600 };
    expect(checkExcessiveGap(data, lenientThresholds)).toHaveLength(0);
  });

  it("only checks sequence flows, not data associations", () => {
    const task = shape({ id: "t1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const dataObj = shape({ id: "d1", elementType: "bpmn:DataObjectReference", bounds: { x: 700, y: 300, width: 36, height: 50 } });
    const assoc = edge({
      id: "a1",
      elementType: "bpmn:DataOutputAssociation",
      sourceRef: "t1",
      targetRef: "d1",
      waypoints: [{ x: 150, y: 180 }, { x: 718, y: 300 }],
    });
    const data = diagramData([task, dataObj], [assoc]);
    expect(checkExcessiveGap(data, DEFAULT_THRESHOLDS)).toHaveLength(0);
  });

  it("handles right-to-left flows (negative gap → skip)", () => {
    const src = shape({ id: "s1", bounds: { x: 700, y: 100, width: 100, height: 80 } });
    const tgt = shape({ id: "s2", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const flow = edge({
      id: "f1",
      elementType: "bpmn:SequenceFlow",
      sourceRef: "s1",
      targetRef: "s2",
      waypoints: [{ x: 700, y: 140 }, { x: 200, y: 140 }],
    });
    const data = diagramData([src, tgt], [flow]);
    expect(checkExcessiveGap(data, DEFAULT_THRESHOLDS)).toHaveLength(0);
  });
});

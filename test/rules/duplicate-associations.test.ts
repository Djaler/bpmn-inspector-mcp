import { describe, it, expect, beforeEach } from "vitest";
import { resetIds, shape, edge, diagramData } from "../helpers.js";
import { checkDuplicateAssociations } from "../../src/validator/rules/duplicate-associations.js";

describe("checkDuplicateAssociations", () => {
  beforeEach(() => resetIds());

  it("returns no issues when each pair has one association", () => {
    const task = shape({ id: "task1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const dataObj = shape({ id: "data1", elementType: "bpmn:DataObjectReference", bounds: { x: 100, y: 300, width: 36, height: 50 } });
    const assoc = edge({
      id: "assoc1",
      elementType: "bpmn:DataOutputAssociation",
      sourceRef: "task1",
      targetRef: "data1",
      waypoints: [{ x: 150, y: 180 }, { x: 150, y: 300 }],
    });
    const data = diagramData([task, dataObj], [assoc]);
    expect(checkDuplicateAssociations(data)).toHaveLength(0);
  });

  it("detects duplicate data output associations between the same pair", () => {
    const task = shape({ id: "task1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const dataObj = shape({ id: "data1", elementType: "bpmn:DataObjectReference", bounds: { x: 100, y: 300, width: 36, height: 50 } });
    const assoc1 = edge({
      id: "assoc1",
      elementType: "bpmn:DataOutputAssociation",
      sourceRef: "task1",
      targetRef: "data1",
      waypoints: [{ x: 140, y: 180 }, { x: 120, y: 300 }],
    });
    const assoc2 = edge({
      id: "assoc2",
      elementType: "bpmn:DataOutputAssociation",
      sourceRef: "task1",
      targetRef: "data1",
      waypoints: [{ x: 160, y: 180 }, { x: 130, y: 300 }],
    });
    const data = diagramData([task, dataObj], [assoc1, assoc2]);
    const issues = checkDuplicateAssociations(data);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("duplicate_connection");
    expect(issues[0].severity).toBe("warning");
    expect(issues[0].elementIds).toContain("task1");
    expect(issues[0].elementIds).toContain("data1");
    expect(issues[0].details.count).toBe(2);
  });

  it("detects duplicate data input associations", () => {
    const task = shape({ id: "task1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const dataStore = shape({ id: "store1", elementType: "bpmn:DataStoreReference", bounds: { x: 100, y: 300, width: 50, height: 50 } });
    const assoc1 = edge({
      id: "assoc1",
      elementType: "bpmn:DataInputAssociation",
      sourceRef: "store1",
      targetRef: "task1",
      waypoints: [{ x: 120, y: 300 }, { x: 140, y: 180 }],
    });
    const assoc2 = edge({
      id: "assoc2",
      elementType: "bpmn:DataInputAssociation",
      sourceRef: "store1",
      targetRef: "task1",
      waypoints: [{ x: 130, y: 300 }, { x: 160, y: 180 }],
    });
    const data = diagramData([task, dataStore], [assoc1, assoc2]);
    const issues = checkDuplicateAssociations(data);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("duplicate_connection");
  });

  it("does not flag different pairs", () => {
    const task = shape({ id: "task1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const data1 = shape({ id: "data1", elementType: "bpmn:DataObjectReference", bounds: { x: 50, y: 300, width: 36, height: 50 } });
    const data2 = shape({ id: "data2", elementType: "bpmn:DataObjectReference", bounds: { x: 200, y: 300, width: 36, height: 50 } });
    const assoc1 = edge({
      id: "assoc1",
      elementType: "bpmn:DataOutputAssociation",
      sourceRef: "task1",
      targetRef: "data1",
      waypoints: [{ x: 130, y: 180 }, { x: 68, y: 300 }],
    });
    const assoc2 = edge({
      id: "assoc2",
      elementType: "bpmn:DataOutputAssociation",
      sourceRef: "task1",
      targetRef: "data2",
      waypoints: [{ x: 170, y: 180 }, { x: 218, y: 300 }],
    });
    const data = diagramData([task, data1, data2], [assoc1, assoc2]);
    expect(checkDuplicateAssociations(data)).toHaveLength(0);
  });

  it("detects duplicate message flows between the same pair", () => {
    const participant = shape({ id: "pool1", elementType: "bpmn:Participant", bounds: { x: 50, y: 50, width: 800, height: 300 } });
    const task = shape({ id: "task1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const msg1 = edge({
      id: "msg1",
      elementType: "bpmn:MessageFlow",
      sourceRef: "pool1",
      targetRef: "task1",
      waypoints: [{ x: 200, y: 50 }, { x: 150, y: 100 }],
    });
    const msg2 = edge({
      id: "msg2",
      elementType: "bpmn:MessageFlow",
      sourceRef: "pool1",
      targetRef: "task1",
      waypoints: [{ x: 300, y: 50 }, { x: 160, y: 100 }],
    });
    const msg3 = edge({
      id: "msg3",
      elementType: "bpmn:MessageFlow",
      sourceRef: "pool1",
      targetRef: "task1",
      waypoints: [{ x: 400, y: 50 }, { x: 170, y: 100 }],
    });
    const data = diagramData([participant, task], [msg1, msg2, msg3]);
    const issues = checkDuplicateAssociations(data);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe("duplicate_connection");
    expect(issues[0].details.count).toBe(3);
  });

  it("ignores sequence flows", () => {
    const task1 = shape({ id: "task1", bounds: { x: 100, y: 100, width: 100, height: 80 } });
    const task2 = shape({ id: "task2", bounds: { x: 300, y: 100, width: 100, height: 80 } });
    const flow1 = edge({
      id: "flow1",
      elementType: "bpmn:SequenceFlow",
      sourceRef: "task1",
      targetRef: "task2",
      waypoints: [{ x: 200, y: 140 }, { x: 300, y: 140 }],
    });
    const flow2 = edge({
      id: "flow2",
      elementType: "bpmn:SequenceFlow",
      sourceRef: "task1",
      targetRef: "task2",
      waypoints: [{ x: 200, y: 140 }, { x: 250, y: 100 }, { x: 300, y: 140 }],
    });
    const data = diagramData([task1, task2], [flow1, flow2]);
    expect(checkDuplicateAssociations(data)).toHaveLength(0);
  });
});

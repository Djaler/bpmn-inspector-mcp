import { readFile } from "node:fs/promises";
import { parseDiagram } from "../validator/parse-diagram.js";
import { DEFAULT_THRESHOLDS, type Thresholds, type ValidationResult } from "../validator/types.js";
import { checkOverlap } from "../validator/rules/overlap.js";
import { checkSpacing } from "../validator/rules/spacing.js";
import { checkFlowCrossing } from "../validator/rules/flow-crossing.js";
import { checkOutOfBounds } from "../validator/rules/out-of-bounds.js";
import { checkLabelOverlap } from "../validator/rules/label-overlap.js";

export async function validateLayout(
  filePath: string,
  thresholds?: Partial<Thresholds>,
): Promise<{ isError?: boolean; content: Array<{ type: "text"; text: string }> }> {
  try {
    const xml = await readFile(filePath, "utf-8");
    const data = await parseDiagram(xml);

    const mergedThresholds: Thresholds = {
      ...DEFAULT_THRESHOLDS,
      ...thresholds,
    };

    const issues = [
      ...checkOverlap(data, mergedThresholds),
      ...checkSpacing(data, mergedThresholds),
      ...checkFlowCrossing(data),
      ...checkOutOfBounds(data),
      ...checkLabelOverlap(data),
    ];

    const errorCount = issues.filter(i => i.severity === "error").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;

    const summaryParts: string[] = [];
    if (errorCount > 0) summaryParts.push(`${errorCount} error(s)`);
    if (warningCount > 0) summaryParts.push(`${warningCount} warning(s)`);

    const result: ValidationResult = {
      valid: issues.length === 0,
      issueCount: issues.length,
      issues,
      summary: issues.length === 0
        ? "No layout issues found"
        : `Found ${issues.length} issue(s): ${summaryParts.join(", ")}`,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Validation failed: ${message}` }],
    };
  }
}

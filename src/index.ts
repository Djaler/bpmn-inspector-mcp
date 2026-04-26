#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { renderBpmn } from "./tools/render.js";
import { validateLayout } from "./tools/validate-layout.js";
import { closeBrowser } from "./renderer/browser-manager.js";

const server = new McpServer({
  name: "bpmn-inspector-mcp",
  version: "0.1.0",
});

server.registerTool("render_bpmn", {
  title: "Render BPMN Diagram",
  description:
    "Renders a BPMN file to a PNG image using the same engine as Camunda Modeler. " +
    "Use to visually inspect diagram layout and verify element positioning.",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: z.object({
    filePath: z.string().describe("Absolute path to a .bpmn file"),
    maxWidth: z
      .number()
      .optional()
      .describe("Maximum image width in pixels (default: 4000). Use lower values (e.g. 2000) for a quick overview, higher values for detailed inspection."),
  }),
}, async ({ filePath, maxWidth }) => {
  return await renderBpmn(filePath, maxWidth ?? undefined);
});

server.registerTool("validate_bpmn_layout", {
  title: "Validate BPMN Layout",
  description:
    "Analyzes the visual layout of a BPMN diagram and reports issues: " +
    "overlapping elements, insufficient spacing, flows crossing through elements, " +
    "out-of-bounds elements, label collisions.",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: z.object({
    filePath: z.string().describe("Absolute path to a .bpmn file"),
    thresholds: z
      .object({
        minSpacing: z
          .number()
          .optional()
          .describe("Minimum spacing between elements in pixels (default: 30)"),
        overlapTolerance: z
          .number()
          .optional()
          .describe("Pixel tolerance for overlap detection (default: 0)"),
      })
      .optional()
      .describe("Override default validation thresholds"),
  }),
}, async ({ filePath, thresholds }) => {
  return await validateLayout(filePath, thresholds ?? undefined);
});

async function shutdown(): Promise<void> {
  await closeBrowser();
  await server.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

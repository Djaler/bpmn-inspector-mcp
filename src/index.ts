#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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
    "Use to visually inspect diagram layout and verify element positioning. " +
    "For a complete check, combine with validate_bpmn_layout — visual inspection alone may miss structural issues.",
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
    "out-of-bounds elements, label collisions, duplicate data associations, " +
    "and excessive gaps between connected elements. " +
    "After modifying a BPMN file, always run this tool to check for structural issues.",
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
        maxGap: z
          .number()
          .optional()
          .describe("Maximum gap between connected elements in pixels before warning (default: 300)"),
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

async function installSkill(): Promise<void> {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const sourcePath = join(__dirname, "..", "skills", "bpmn-review.md");
  const targetDir = join(process.cwd(), ".claude", "skills", "bpmn-review");
  const targetPath = join(targetDir, "SKILL.md");

  await mkdir(targetDir, { recursive: true });
  await copyFile(sourcePath, targetPath);

  console.log(`Installed bpmn-review skill to ${targetPath}`);
}

if (process.argv[2] === "install-skill") {
  installSkill().catch((err) => {
    console.error("Failed to install skill:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
} else {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

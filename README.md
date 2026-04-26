# BPMN Inspector MCP Server

MCP server for visual inspection and layout validation of BPMN diagrams.
Enables AI agents (Claude Code, Cursor, etc.) to render BPMN files as images and detect layout issues like overlapping elements, insufficient spacing, and crossing flows.

## Quick Start

**Requirements:** Node.js 18+, Google Chrome or Chromium

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "bpmn-inspector": {
      "command": "npx",
      "args": ["-y", "bpmn-inspector-mcp"]
    }
  }
}
```

Restart your MCP client (Claude Code, etc.).

## What It Does

Ask your AI agent to inspect a BPMN diagram:

> "Render the BPMN file at src/main/resources/bpmn/process.bpmn and check for layout issues"

The agent will:
1. **Render** the diagram to a PNG image for visual inspection
2. **Validate** the layout and report specific issues (overlapping elements, tight spacing, etc.)
3. **Fix** layout problems by adjusting coordinates in the BPMN XML

## Tools

### `render_bpmn`

Renders a BPMN file to a PNG image using [bpmn-js](https://bpmn.io/toolkit/bpmn-js/) (the same rendering engine as Camunda Modeler).

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | string | Absolute path to a `.bpmn` file |
| `maxWidth` | number? | Maximum image width in pixels (default: 4000). Lower values save tokens, higher values show more detail. |

Returns a PNG image as MCP image content.

### `validate_bpmn_layout`

Analyzes the visual layout of a BPMN diagram and reports issues.

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | string | Absolute path to a `.bpmn` file |
| `thresholds.minSpacing` | number? | Minimum spacing between elements in pixels (default: 30) |
| `thresholds.overlapTolerance` | number? | Pixel tolerance for overlap detection (default: 0) |

Returns a JSON report with issues found.

## Validation Rules

| Rule | Severity | Description |
|------|----------|-------------|
| **overlap** | error | Elements with intersecting bounding boxes |
| **too_close** | warning | Elements closer than `minSpacing` threshold |
| **flow_crossing** | warning | Sequence/message flows passing through unrelated elements |
| **out_of_bounds** | warning | Elements at negative coordinates |
| **label_overlap** | warning | Labels overlapping other elements |

Smart exclusions are built in:
- Container elements (Pools, Lanes, expanded SubProcesses, Groups) don't conflict with their children
- Boundary events don't conflict with their host activity or each other on the same host
- Pool-to-pool spacing is excluded (controlled by the modeler)

## Building from Source

```bash
git clone https://github.com/Djaler/bpmn-inspector-mcp.git
cd bpmn-inspector-mcp
npm install
npm run build
```

To use a local build in your MCP config:

```json
{
  "mcpServers": {
    "bpmn-inspector": {
      "command": "node",
      "args": ["/path/to/bpmn-inspector-mcp/dist/index.js"]
    }
  }
}
```

## License

MIT

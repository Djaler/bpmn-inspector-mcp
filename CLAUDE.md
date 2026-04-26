# BPMN Inspector MCP Server

MCP server for visual inspection and layout validation of BPMN diagrams.

## Tech Stack

- **Language**: TypeScript (strict mode, ESM)
- **MCP SDK**: `@modelcontextprotocol/sdk` (stdio transport)
- **Rendering**: `bpmn-js` (browser lib, loaded in Puppeteer) + `puppeteer-core` (uses system Chrome)
- **Validation**: `bpmn-moddle` (BPMN XML parser) + coordinate geometry
- **Build**: `tsc` → `dist/`

## Architecture

```
src/
  index.ts                     — Entry point: MCP server, tool registration, stdio transport
  tools/
    render.ts                  — render_bpmn tool (Puppeteer + bpmn-js → PNG)
    validate-layout.ts         — validate_bpmn_layout tool (orchestrates all rules)
  renderer/
    browser-manager.ts         — Puppeteer browser singleton (lazy init, 5-min idle timeout)
    render-page.ts             — Minimal HTML template for bpmn-js viewer
  validator/
    types.ts                   — DiagramShape, DiagramEdge, ValidationIssue, container detection
    parse-diagram.ts           — bpmn-moddle parser: BPMN XML → shapes/edges with coordinates
    rules/
      overlap.ts               — Bounding box intersection (min 50px² area)
      spacing.ts               — Minimum gap between elements (default 30px)
      flow-crossing.ts         — Flows crossing through unrelated elements
      out-of-bounds.ts         — Elements at negative coordinates
      label-overlap.ts         — Labels overlapping elements (with 5px shrink tolerance)
  utils/
    geometry.ts                — Rect intersection, containment, gap calculation, segment-rect tests
```

## Key Design Decisions

- **bpmn-js runs in Puppeteer**, not in Node.js — it's a browser library. CSS + JS + fonts are loaded from `node_modules/bpmn-js/dist/`.
- **puppeteer-core** (not puppeteer) — no bundled Chromium, uses system Chrome. Keeps the npm package small.
- **Container detection is geometric** — `rectContains(outer, inner)` instead of traversing semantic `$parent`/`processRef`/`lane.flowNodeRef`. Simpler, handles all container types uniformly.
- **BoundaryEvent pairs on the same host are excluded** from both overlap and spacing checks — they naturally sit close together.
- **Label bounds are shrunk by 5px** before overlap checks — DI label bounds are often larger than the rendered text.
- **Overlap requires ≥50px² area** — filters out trivial edge-touching from imprecise DI bounds.

## Building & Running

```bash
npm install
npm run build
node dist/index.js    # stdio MCP server
```

## Adding a New Validation Rule

1. Create `src/validator/rules/<rule-name>.ts`
2. Export a function: `(data: DiagramData, ...) => ValidationIssue[]`
3. Add it to the rule list in `src/tools/validate-layout.ts`
4. Use `formatElement(id, name, type)` from `types.ts` for human-readable messages

---
name: bpmn-review
description: >-
  BPMN diagram review workflow for structural and visual quality checks.
  TRIGGER when ANY of these MCP tools are available: render_bpmn, validate_bpmn_layout.
  Use when the agent modifies a .bpmn file, when the user asks to review or check
  a BPMN diagram, or when validating diagram quality after refactoring.
---

# BPMN Review

Automated review workflow for BPMN diagrams using the bpmn-inspector MCP tools.

## When to Trigger

- After **any** modification to a `.bpmn` file
- When the user asks to review, check, or validate a BPMN diagram
- After refactoring that merges, splits, or removes process steps

## Workflow

### Step 1: Validate layout

Call `validate_bpmn_layout` on the BPMN file. Review the results:

- **Errors** (overlap) — must be fixed before proceeding
- **Warnings** (spacing, crossings, duplicate associations, excessive gaps) — report to user with suggested actions

Pay special attention to post-refactoring issues:
- `duplicate_connection` — redundant data associations or message flows left after merging steps. Fix: remove duplicates in the BPMN editor
- `excessive_gap` — empty space left after removing a step. Fix: reposition elements to close the gap

### Step 2: Render and visually inspect

Call `render_bpmn` on the BPMN file. Look at the rendered image and check for:

- **Visual clutter** — too many arrows concentrated on one element
- **Alignment issues** — elements not aligned on the same horizontal/vertical line
- **Inconsistent sizing** — similar elements with different sizes
- **Missing labels** — flows or gateways without descriptive labels
- **Readability** — can the process be understood by reading left to right?

The validator does not catch everything. Your visual inspection is the second line of defense.

### Step 3: Report

Summarize findings to the user:
1. List all validation issues with severity
2. Note any visual problems you spotted in the render
3. Suggest specific fixes for each issue

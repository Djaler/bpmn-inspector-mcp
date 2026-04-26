# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-04-26

### Added

- **duplicate_connection** (warning) — detects duplicate data associations or message flows between the same element pair (common after merging BPMN steps)
- **excessive_gap** (warning) — detects empty horizontal corridors between connected elements with no shapes in between (common after removing intermediate steps)
- `maxGap` threshold parameter for `validate_bpmn_layout` (default: 300px)
- `bpmn-review` Claude Code skill — auto-triggered workflow that runs validation + visual inspection when working with BPMN files
- `npx bpmn-inspector-mcp install-skill` CLI command — installs the skill into a project's `.claude/skills/` directory
- Test infrastructure (vitest) with 13 tests covering both new rules

### Changed

- `validate_bpmn_layout` and `render_bpmn` tool descriptions now recommend running validation after BPMN modifications

## [0.1.0] - 2026-04-26

### Added

- `render_bpmn` tool — renders BPMN files to PNG images using bpmn-js (the same engine as Camunda Modeler). Supports `maxWidth` parameter for controlling image size vs token cost tradeoff.
- `validate_bpmn_layout` tool — analyzes BPMN diagram layout and reports issues:
  - **overlap** (error) — elements with intersecting bounding boxes
  - **too_close** (warning) — elements closer than minimum spacing threshold (default: 30px)
  - **flow_crossing** (warning) — sequence/message flows passing through unrelated elements
  - **out_of_bounds** (warning) — elements at negative coordinates
  - **label_overlap** (warning) — labels overlapping other elements
- Smart exclusions: container-child pairs, boundary events on the same host, pool-to-pool spacing
- Human-readable element names in validation messages (e.g. `'Task_1' «Send notification» (bpmn:ServiceTask)`)
- System Chrome/Chromium detection (no bundled browser — uses puppeteer-core)
- Puppeteer browser idle timeout (5 minutes) to free memory when not in use

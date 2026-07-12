---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-12
related-adrs:
  - ADR-0001
  - ADR-0016
  - ADR-0017
---

# Desktop Requirement Catalog

This catalog gives every traceable requirement a stable product name and defines when planned work may be marked implemented. Requirement IDs remain the compatibility keys used by `requirements.yaml`, the Acceptance Matrix, ADRs, tests, and release evidence.

## Status rules

- `implemented` requires production code and concrete verification evidence.
- `planned` remains planned until its complete user journey passes.
- Documents, mock interfaces, scaffolds, and skipped tests are not implementation evidence.
- Status, traceability, acceptance evidence, and parity documentation change in the same pull request.
- Catalog changes alone never implement runtime behavior.

## Remaining functional requirement

### FR-002 — Safe article import and publishing

A user chooses a Markdown file or article folder, reviews a deterministic import plan, corrects metadata, confirms a writable target, and receives either a fully committed article or an unchanged workspace.

Acceptance requires:

1. Preview supports a single Markdown source or a folder containing `article.md`, optional `research-activity.md`, and optional `assets/`.
2. Preview normalizes title, category, English kebab-case slug, tags, cleanup actions, output files, copied assets, and warnings without writing.
3. Commit writes to a temporary sibling directory, validates the generated article, and atomically renames it into place.
4. Existing targets, traversal, symlink escape, invalid metadata, missing sources, bundled read-only roots, write failures, and post-write validation failures leave no partial output and never delete the source.
5. Source removal is a separate explicit action after successful commit; keep-raw behavior remains available.
6. The committed article is immediately available to article list, search, manifest, diagnostics, internal links, assets, and reader journeys.
7. Unit, contract, security, and Electron E2E evidence covers preview, metadata correction, commit, rollback, restart persistence, and source retention.

Current partial evidence: `packages/content-engine/src/article-import/index.test.ts` verifies deterministic write-free previews, constrained file and folder sources, cleanup, metadata inference and validation, asset inventory, source retention, missing-asset warnings, and blocking target conflicts. `packages/content-engine/src/article-import/commit.test.ts` verifies source and asset fingerprints, stale-plan and late-conflict rejection, owned concurrency locks, sibling staging, exclusive writes, post-write validation, atomic rename, rollback without residue, default source retention, and separately validated source removal. Typed desktop contracts, native selection, preview and metadata UI, workspace refresh and navigation, restart persistence, accessibility, and Electron E2E are not present yet, so FR-002 remains `planned`.

## Remaining non-functional requirements

### NFR-010 — Enforced coverage thresholds

CI must enforce statements/branches of domain 95/90, content engine 90/85, application 90/85, and overall 80/75. Exclusions require reviewed configuration.

### NFR-011 — Search and index performance

Deterministic 1,000- and 10,000-article benchmarks must show warm query and filter-update p95 at or below 100 ms, measured serialization/deserialization, and no renderer synchronous block over 50 ms. Large index construction runs outside the renderer main thread.

### NFR-012 — Startup performance telemetry

Record process start, app ready, window created, renderer ready, archive ready, and interactive milestones. Report trends and material regression without one flaky wall-clock gate; the development target remains at most three seconds to interactive.

### NFR-013 — Bundle and footprint budgets

Measure production packages and renderer output. Installed footprint targets at most 250 MB and initial renderer JavaScript at most 2 MB gzip excluding lazy chunks. Do not package repository sources, Python environments, MkDocs dependencies, test fixtures, or diagnostics.

### NFR-014 — WCAG 2.2 AA desktop accessibility

Keyboard-only, screen-reader, 200 percent zoom, dark/light contrast, visible focus, and reduced-motion journeys must cover search, browsing, reading, workspaces, diagnostics, import, dialogs, and Observatory fallback.

### NFR-019 — Dependency governance

Important dependencies record purpose, alternatives, execution boundary, runtime classification, security surface, license, native-module impact, and packaging impact. High or critical production vulnerabilities fail CI unless a time-bounded accepted exception exists.

### NFR-025 — Local recovery and privacy-safe logging

Unexpected main, renderer, preference, search-index, workspace, and import failures return typed actionable errors where possible and write bounded local diagnostics. Logs contain no article bodies, secrets, raw IPC payloads, telemetry identifiers, or unredacted full workspace paths.

## Delivery sequence

| Planned PR | Scope                                                          | Completion rule                                                     |
| ---------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| PR #27     | Import domain, cleanup, and deterministic preview              | FR-002 remains planned.                                             |
| PR #28     | Atomic commit, conflict handling, and rollback                 | FR-002 remains planned.                                             |
| PR #29     | Desktop Import Wizard and complete E2E                         | FR-002 becomes implemented only after all journeys pass.            |
| PR #30     | Versioned user library and recent workspace management         | New functional IDs are added before implementation.                 |
| PR #31     | Serialized incremental search index and benchmarks             | NFR-011 requires 10,000-article evidence.                           |
| PR #32     | Manifest-derived Observatory graph foundation                  | New functional IDs cover graph, filtering, summary, and navigation. |
| PR #33     | Observatory accessibility, reduced motion, and scale           | NFR-014 requires all core journeys and accessible fallback.         |
| PR #34     | Coverage, startup, bundle, dependency, and logging convergence | Each NFR changes status independently from evidence.                |

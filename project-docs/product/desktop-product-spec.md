---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0001
  - ADR-0009
  - ADR-0010
  - ADR-0011
  - ADR-0012
  - ADR-0016
---

# Desktop Product Spec

## Current P1 Offline Reader Scope

The current implementation provides the offline bundled reader, secure Electron shell, content parsing, full-text search, category/tag/timeline browsing, sanitized reading with local image lightbox, fenced-code copy, strict lazy Mermaid rendering, lazy syntax highlighting, accessible footnotes, persistent theme and text preferences, semantic Back/Forward navigation, persistent resizable desktop layout, typed native commands and command palette, persistent validated local workspaces, native packaging, and a verified draft-release pipeline. Requirements without concrete code and verification artifacts remain planned.

The stable requirement names, acceptance rules for all remaining work, and sequenced delivery boundaries are defined in `project-docs/product/desktop-requirement-catalog.md`. Requirement IDs remain the traceability keys.

## FR-001

**Name:** Offline bundled archive.

Status: `implemented`. Verification: packages/application/src/index.test.ts, apps/desktop-electron/e2e/source.spec.ts, scripts/packaged-smoke.mjs.

## FR-002

**Name:** Safe article import and publishing.

Status: `implemented`. Verification: packages/content-engine/src/article-import/index.test.ts, packages/content-engine/src/article-import/commit.test.ts, packages/platform-contracts/src/import-contract.test.ts, apps/desktop-electron/src/main/import-session.test.ts, apps/desktop-electron/tests/security.spec.ts, apps/desktop-electron/e2e/import-wizard.spec.ts.

## FR-003

**Name:** Canonical article parsing.

Status: `implemented`. Verification: packages/content-engine/src/index.test.ts.

## FR-004

**Name:** Category browsing.

Status: `implemented`. Verification: packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-005

**Name:** Tag browsing.

Status: `implemented`. Verification: packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-006

**Name:** Timeline browsing.

Status: `implemented`. Verification: packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-007

**Name:** Offline full-text search.

Status: `implemented`. Verification: packages/search-engine/src/index.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-008

**Name:** Packaged reader startup.

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts, scripts/packaged-smoke.mjs.

## FR-009

**Name:** Reading statistics.

Status: `implemented`. Verification: packages/content-engine/src/index.test.ts.

## FR-010

**Name:** Safe internal navigation.

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## FR-011

**Name:** Typed desktop boundary.

Status: `implemented`. Verification: packages/platform-contracts/src/index.test.ts, apps/desktop-electron/tests/security.spec.ts.

## FR-012

**Name:** Sanitized article rendering.

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## FR-013

**Name:** Accessible code copy.

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/copy-code.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-014

**Name:** Lazy Mermaid diagrams.

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/mermaid-renderer.test.ts, apps/desktop-electron/e2e/mermaid.spec.ts.

## FR-015

**Name:** Lazy syntax highlighting.

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/syntax-highlight.test.ts, apps/desktop-electron/e2e/syntax-highlight.spec.ts.

## FR-016

**Name:** Accessible footnotes.

Status: `implemented`. Verification: packages/renderer-ui/src/index.test.ts, apps/desktop-electron/e2e/footnotes.spec.ts.

## FR-017

**Name:** Reader preferences.

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/preferences.test.ts, apps/desktop-electron/e2e/preferences.spec.ts.

## FR-018

**Name:** Semantic reading history.

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/navigation-history.test.ts, apps/desktop-electron/e2e/navigation-history.spec.ts.

## FR-019

**Name:** Persistent desktop layout.

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/layout-preferences.test.ts, apps/desktop-electron/src/main/window-state.test.ts, apps/desktop-electron/e2e/resizable-layout.spec.ts.

## FR-020

**Name:** Native commands and Command Palette.

Status: `implemented`. Verification: packages/platform-contracts/src/desktop-command.test.ts, apps/desktop-electron/src/renderer/desktop-commands.test.ts, apps/desktop-electron/e2e/command-palette.spec.ts.

## FR-021

**Name:** Validated local workspaces.

Status: `implemented`. Verification: packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts.

## FR-022

**Name:** About and build information.

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## FR-023

**Name:** Windows release artifacts.

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, scripts/release-assets.mjs, scripts/packaged-smoke.mjs.

## FR-024

**Name:** Linux release artifacts.

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, scripts/release-assets.mjs, scripts/packaged-smoke.mjs.

## FR-025

**Name:** Manual release dispatch.

Status: `implemented`. Verification: .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md.

## FR-026

**Name:** Release aggregation and manifest.

Status: `implemented`. Verification: scripts/aggregate-release.mjs, scripts/verify-release-assets.mjs, project-docs/release/verification-run-29113199684.md.

## FR-027

**Name:** Draft-first release creation.

Status: `implemented`. Verification: .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md.

## FR-028

**Name:** Explicit release publication.

Status: `implemented`. Verification: .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md.

## FR-029

**Name:** Supported Node smoke verification.

Status: `implemented`. Verification: scripts/node-smoke.mjs.

## FR-030

**Name:** MkDocs feature disposition.

Status: `implemented`. Verification: project-docs/migration/mkdocs-feature-parity-matrix.md.

## NFR-001

**Name:** Offline-first operation.

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## NFR-002

**Name:** Renderer isolation.

Status: `implemented`. Verification: apps/desktop-electron/tests/security.spec.ts.

## NFR-003

**Name:** IPC sender validation.

Status: `implemented`. Verification: apps/desktop-electron/tests/security.spec.ts.

## NFR-004

**Name:** Navigation confinement.

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## NFR-005

**Name:** Runtime schema validation.

Status: `implemented`. Verification: packages/platform-contracts/src/index.test.ts.

## NFR-006

**Name:** Restrictive Content Security Policy.

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/index.html.

## NFR-007

**Name:** Permission denial.

Status: `implemented`. Verification: apps/desktop-electron/tests/security.spec.ts.

## NFR-008

**Name:** Local asset confinement.

Status: `implemented`. Verification: apps/desktop-electron/tests/asset-path.spec.ts.

## NFR-009

**Name:** Fault-isolated content scanning.

Status: `implemented`. Verification: packages/content-engine/src/index.test.ts.

## NFR-010

**Name:** Enforced coverage thresholds.

Status: `planned`. Verification: planned for PR #34; exact package and overall thresholds are defined in the requirement catalog.

## NFR-011

**Name:** Search and index performance.

Status: `planned`. Verification: planned for PR #31 using deterministic 1,000- and 10,000-article benchmarks.

## NFR-012

**Name:** Startup performance telemetry.

Status: `planned`. Verification: planned for PR #34 with milestone timing and regression reporting.

## NFR-013

**Name:** Bundle and footprint budgets.

Status: `planned`. Verification: planned for PR #34 with renderer and packaged-output reports.

## NFR-014

**Name:** WCAG 2.2 AA desktop accessibility.

Status: `planned`. Verification: planned for PR #33 after Import Wizard and Observatory journeys exist.

## NFR-015

**Name:** Cross-platform package smoke.

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, scripts/packaged-smoke.mjs, project-docs/release/verification-run-29113199684.md.

## NFR-016

**Name:** Immutable and least-privilege CI.

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts.

## NFR-017

**Name:** Release concurrency and authority.

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts.

## NFR-018

**Name:** Reproducible release evidence.

Status: `implemented`. Verification: .github/workflows/desktop-release-reusable.yml, scripts/release-scripts.test.ts, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md.

## NFR-019

**Name:** Dependency governance.

Status: `planned`. Verification: planned for PR #34 with inventory, audit policy, and reviewed exception semantics.

## NFR-020

**Name:** Architecture boundaries.

Status: `implemented`. Verification: scripts/validate-architecture.mjs.

## NFR-021

**Name:** Traceability gate.

Status: `implemented`. Verification: scripts/validate-traceability.mjs.

## NFR-022

**Name:** Traditional Chinese primary experience.

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## NFR-023

**Name:** Focus-safe modal interaction.

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/index.html.

## NFR-024

**Name:** Explicit product scope.

Status: `implemented`. Verification: project-docs/product/desktop-product-spec.md.

## NFR-025

**Name:** Local recovery and privacy-safe logging.

Status: `planned`. Verification: planned for PR #34 with typed recovery journeys and redacted bounded local diagnostics.

---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0001
  - ADR-0009
---

# Desktop Product Spec

## Current P1 Offline Reader Scope

The current implementation provides the offline bundled reader, secure Electron shell, content parsing, full-text search, category/tag/timeline browsing, sanitized reading with local image lightbox, fenced-code copy, and strict lazy Mermaid rendering, native packaging, and a verified draft-release pipeline. Requirements without concrete code and verification artifacts remain planned.

## FR-001

Status: `implemented`. Verification: packages/application/src/index.test.ts, apps/desktop-electron/e2e/source.spec.ts, scripts/packaged-smoke.mjs.

## FR-002

Status: `planned`. Verification: planned for a later PR.

## FR-003

Status: `implemented`. Verification: packages/content-engine/src/index.test.ts.

## FR-004

Status: `implemented`. Verification: packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-005

Status: `implemented`. Verification: packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-006

Status: `implemented`. Verification: packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-007

Status: `implemented`. Verification: packages/search-engine/src/index.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-008

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts, scripts/packaged-smoke.mjs.

## FR-009

Status: `implemented`. Verification: packages/content-engine/src/index.test.ts.

## FR-010

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## FR-011

Status: `implemented`. Verification: packages/platform-contracts/src/index.test.ts, apps/desktop-electron/tests/security.spec.ts.

## FR-012

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## FR-013

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/copy-code.test.ts, apps/desktop-electron/e2e/source.spec.ts.

## FR-014

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/mermaid-renderer.test.ts, apps/desktop-electron/e2e/mermaid.spec.ts.

## FR-015

Status: `planned`. Verification: planned for a later PR.

## FR-016

Status: `planned`. Verification: planned for a later PR.

## FR-017

Status: `planned`. Verification: planned for a later PR.

## FR-018

Status: `planned`. Verification: planned for a later PR.

## FR-019

Status: `planned`. Verification: planned for a later PR.

## FR-020

Status: `planned`. Verification: planned for a later PR.

## FR-021

Status: `planned`. Verification: planned for a later PR.

## FR-022

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## FR-023

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, scripts/release-assets.mjs, scripts/packaged-smoke.mjs.

## FR-024

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, scripts/release-assets.mjs, scripts/packaged-smoke.mjs.

## FR-025

Status: `implemented`. Verification: .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md.

## FR-026

Status: `implemented`. Verification: scripts/aggregate-release.mjs, scripts/verify-release-assets.mjs, project-docs/release/verification-run-29113199684.md.

## FR-027

Status: `implemented`. Verification: .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md.

## FR-028

Status: `implemented`. Verification: .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md.

## FR-029

Status: `implemented`. Verification: scripts/node-smoke.mjs.

## FR-030

Status: `implemented`. Verification: project-docs/migration/mkdocs-feature-parity-matrix.md.

## NFR-001

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## NFR-002

Status: `implemented`. Verification: apps/desktop-electron/tests/security.spec.ts.

## NFR-003

Status: `implemented`. Verification: apps/desktop-electron/tests/security.spec.ts.

## NFR-004

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## NFR-005

Status: `implemented`. Verification: packages/platform-contracts/src/index.test.ts.

## NFR-006

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/index.html.

## NFR-007

Status: `implemented`. Verification: apps/desktop-electron/tests/security.spec.ts.

## NFR-008

Status: `implemented`. Verification: apps/desktop-electron/tests/asset-path.spec.ts.

## NFR-009

Status: `implemented`. Verification: packages/content-engine/src/index.test.ts.

## NFR-010

Status: `planned`. Verification: planned for a later PR.

## NFR-011

Status: `planned`. Verification: planned for a later PR.

## NFR-012

Status: `planned`. Verification: planned for a later PR.

## NFR-013

Status: `planned`. Verification: planned for a later PR.

## NFR-014

Status: `planned`. Verification: planned for a later PR.

## NFR-015

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, scripts/packaged-smoke.mjs, project-docs/release/verification-run-29113199684.md.

## NFR-016

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts.

## NFR-017

Status: `implemented`. Verification: .github/workflows/desktop-ci.yml, .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts.

## NFR-018

Status: `implemented`. Verification: .github/workflows/desktop-release-reusable.yml, scripts/release-scripts.test.ts, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md.

## NFR-019

Status: `planned`. Verification: planned for a later PR.

## NFR-020

Status: `implemented`. Verification: scripts/validate-architecture.mjs.

## NFR-021

Status: `implemented`. Verification: scripts/validate-traceability.mjs.

## NFR-022

Status: `implemented`. Verification: apps/desktop-electron/e2e/source.spec.ts.

## NFR-023

Status: `implemented`. Verification: apps/desktop-electron/src/renderer/index.html.

## NFR-024

Status: `implemented`. Verification: project-docs/product/desktop-product-spec.md.

## NFR-025

Status: `planned`. Verification: planned for a later PR.

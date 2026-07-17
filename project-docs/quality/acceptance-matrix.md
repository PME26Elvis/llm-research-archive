---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0001
  - ADR-0018
---

# Acceptance Matrix

| ID | Name | Status | Verification |
| --- | --- | --- | --- |
| FR-001 | Offline bundled archive | implemented | packages/application/src/index.test.ts, apps/desktop-electron/e2e/source.spec.ts, scripts/packaged-smoke.mjs |
| FR-002 | Safe article import and publishing | implemented | packages/content-engine/src/article-import/index.test.ts, packages/content-engine/src/article-import/commit.test.ts, packages/platform-contracts/src/import-contract.test.ts, apps/desktop-electron/src/main/import-session.test.ts, apps/desktop-electron/tests/security.spec.ts, apps/desktop-electron/e2e/import-wizard.spec.ts |
| FR-003 | Canonical article parsing | implemented | packages/content-engine/src/index.test.ts |
| FR-004 | Category browsing | implemented | packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts |
| FR-005 | Tag browsing | implemented | packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts |
| FR-006 | Timeline browsing | implemented | packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts |
| FR-007 | Offline full-text search | implemented | packages/search-engine/src/index.test.ts, apps/desktop-electron/e2e/source.spec.ts |
| FR-008 | Packaged reader startup | implemented | apps/desktop-electron/e2e/source.spec.ts, scripts/packaged-smoke.mjs |
| FR-009 | Reading statistics | implemented | packages/content-engine/src/index.test.ts |
| FR-010 | Safe internal navigation | implemented | apps/desktop-electron/e2e/source.spec.ts |
| FR-011 | Typed desktop boundary | implemented | packages/platform-contracts/src/index.test.ts, apps/desktop-electron/tests/security.spec.ts |
| FR-012 | Sanitized article rendering | implemented | apps/desktop-electron/e2e/source.spec.ts |
| FR-013 | Accessible code copy | implemented | apps/desktop-electron/src/renderer/copy-code.test.ts, apps/desktop-electron/e2e/source.spec.ts |
| FR-014 | Lazy Mermaid diagrams | implemented | apps/desktop-electron/src/renderer/mermaid-renderer.test.ts, apps/desktop-electron/e2e/mermaid.spec.ts |
| FR-015 | Lazy syntax highlighting | implemented | apps/desktop-electron/src/renderer/syntax-highlight.test.ts, apps/desktop-electron/e2e/syntax-highlight.spec.ts |
| FR-016 | Accessible footnotes | implemented | packages/renderer-ui/src/index.test.ts, apps/desktop-electron/e2e/footnotes.spec.ts |
| FR-017 | Reader preferences | implemented | apps/desktop-electron/src/renderer/preferences.test.ts, apps/desktop-electron/e2e/preferences.spec.ts |
| FR-018 | Semantic reading history | implemented | apps/desktop-electron/src/renderer/navigation-history.test.ts, apps/desktop-electron/e2e/navigation-history.spec.ts |
| FR-019 | Persistent desktop layout | implemented | apps/desktop-electron/src/renderer/layout-preferences.test.ts, apps/desktop-electron/src/main/window-state.test.ts, apps/desktop-electron/e2e/resizable-layout.spec.ts |
| FR-020 | Native commands and Command Palette | implemented | packages/platform-contracts/src/desktop-command.test.ts, apps/desktop-electron/src/renderer/desktop-commands.test.ts, apps/desktop-electron/e2e/command-palette.spec.ts |
| FR-021 | Validated local workspaces | implemented | packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts |
| FR-022 | About and build information | implemented | apps/desktop-electron/e2e/source.spec.ts |
| FR-023 | Windows release artifacts | implemented | .github/workflows/desktop-ci.yml, scripts/release-assets.mjs, scripts/packaged-smoke.mjs |
| FR-024 | Linux release artifacts | implemented | .github/workflows/desktop-ci.yml, scripts/release-assets.mjs, scripts/packaged-smoke.mjs |
| FR-025 | Manual release dispatch | implemented | .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md |
| FR-026 | Release aggregation and manifest | implemented | scripts/aggregate-release.mjs, scripts/verify-release-assets.mjs, project-docs/release/verification-run-29113199684.md |
| FR-027 | Draft-first release creation | implemented | .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md |
| FR-028 | Explicit release publication | implemented | .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md |
| FR-029 | Supported Node smoke verification | implemented | scripts/node-smoke.mjs |
| FR-030 | MkDocs feature disposition | implemented | project-docs/migration/mkdocs-feature-parity-matrix.md |
| FR-031 | Switchable interface languages | implemented | apps/desktop-electron/src/renderer/i18n.test.ts, apps/desktop-electron/src/renderer/preferences.test.ts, apps/desktop-electron/src/main/main-i18n.test.ts, apps/desktop-electron/e2e/preferences.spec.ts |
| FR-032 | Structured release descriptions | implemented | scripts/release-notes.test.ts, scripts/workflow-release.test.ts, scripts/validate-release-assets.mjs, .github/workflows/desktop-release-reusable.yml |
| NFR-001 | Offline-first operation | implemented | apps/desktop-electron/e2e/source.spec.ts |
| NFR-002 | Renderer isolation | implemented | apps/desktop-electron/tests/security.spec.ts |
| NFR-003 | IPC sender validation | implemented | apps/desktop-electron/tests/security.spec.ts |
| NFR-004 | Navigation confinement | implemented | apps/desktop-electron/e2e/source.spec.ts |
| NFR-005 | Runtime schema validation | implemented | packages/platform-contracts/src/index.test.ts |
| NFR-006 | Restrictive Content Security Policy | implemented | apps/desktop-electron/tests/security.spec.ts |
| NFR-007 | Permission denial | implemented | apps/desktop-electron/tests/security.spec.ts |
| NFR-008 | Local asset confinement | implemented | apps/desktop-electron/tests/asset-path.spec.ts |
| NFR-009 | Fault-isolated content scanning | implemented | packages/content-engine/src/index.test.ts |
| NFR-010 | Enforced coverage thresholds | implemented | .github/workflows/desktop-ci.yml, packages/content-engine/src/article-import/edge-cases.test.ts, packages/application/src/index.test.ts |
| NFR-011 | Search and index performance | implemented | .github/workflows/desktop-ci.yml, packages/search-engine/src/index.test.ts |
| NFR-012 | Startup performance telemetry | implemented | apps/desktop-electron/src/main/startup-telemetry.test.ts, apps/desktop-electron/e2e/accessibility.spec.ts |
| NFR-013 | Bundle and footprint budgets | implemented | .github/workflows/desktop-ci.yml, .github/workflows/desktop-release-reusable.yml |
| NFR-014 | WCAG 2.2 AA desktop accessibility | implemented | scripts/validate-accessibility.mjs, apps/desktop-electron/e2e/accessibility.spec.ts |
| NFR-015 | Cross-platform package smoke | implemented | .github/workflows/desktop-ci.yml, scripts/packaged-smoke.mjs, project-docs/release/verification-run-29113199684.md |
| NFR-016 | Immutable and least-privilege CI | implemented | .github/workflows/desktop-ci.yml, .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts |
| NFR-017 | Release concurrency and authority | implemented | .github/workflows/desktop-ci.yml, .github/workflows/desktop-release-reusable.yml, scripts/workflow-release.test.ts |
| NFR-018 | Reproducible release evidence | implemented | .github/workflows/desktop-release-reusable.yml, scripts/release-scripts.test.ts, scripts/workflow-release.test.ts, project-docs/release/verification-run-29113199684.md |
| NFR-019 | Dependency governance | implemented | scripts/validate-dependencies.mjs, scripts/dependency-policy.test.ts, .github/workflows/desktop-ci.yml |
| NFR-020 | Architecture boundaries | implemented | scripts/validate-architecture.mjs |
| NFR-021 | Traceability gate | implemented | scripts/validate-traceability.mjs |
| NFR-022 | Traditional Chinese primary experience | implemented | apps/desktop-electron/e2e/source.spec.ts |
| NFR-023 | Focus-safe modal interaction | implemented | apps/desktop-electron/e2e/source.spec.ts |
| NFR-024 | Explicit product scope | implemented | project-docs/product/desktop-product-spec.md |
| NFR-025 | Local recovery and privacy-safe logging | implemented | apps/desktop-electron/src/main/local-diagnostics.test.ts, apps/desktop-electron/e2e/accessibility.spec.ts, packages/platform-contracts/src/quality-contract.test.ts |
| NFR-026 | Localization integrity and native authority | implemented | apps/desktop-electron/tests/security.spec.ts, apps/desktop-electron/src/main/main-i18n.test.ts, apps/desktop-electron/e2e/preferences.spec.ts |
| FR-033 | Dual renderer entries | implemented | packages/platform-contracts/src/renderer-implementation.test.ts, apps/desktop-electron/src/main/renderer-state.test.ts, scripts/astro-output.test.ts, apps/desktop-electron/e2e/renderer-implementations.spec.ts, scripts/packaged-smoke.mjs |
| NFR-027 | Renderer parity and rollback | implemented | scripts/validate-astro-output.mjs, apps/desktop-electron/tests/security.spec.ts, apps/desktop-electron/e2e/renderer-implementations.spec.ts, scripts/packaged-smoke.mjs |

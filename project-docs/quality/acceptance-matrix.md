---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-12
related-adrs:
  - ADR-0001
  - ADR-0017
---

# Acceptance Matrix

| ID     | Name                                | Status      | Verification                                                                                                                                                                                                     |
| ------ | ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001 | Offline bundled archive             | implemented | packages/application/src/index.test.ts, apps/desktop-electron/e2e/source.spec.ts, scripts/packaged-smoke.mjs                                                                                                     |
| FR-002 | Safe article import and publishing  | planned     | packages/content-engine/src/article-import/index.test.ts, packages/content-engine/src/article-import/commit.test.ts; PR #29 Desktop evidence still required                                                      |
| FR-003 | Canonical article parsing           | implemented | packages/content-engine/src/index.test.ts                                                                                                                                                                        |
| FR-004 | Category browsing                   | implemented | packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts                                                                                                                                |
| FR-005 | Tag browsing                        | implemented | packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts                                                                                                                                |
| FR-006 | Timeline browsing                   | implemented | packages/renderer-ui/src/browse.test.ts, apps/desktop-electron/e2e/source.spec.ts                                                                                                                                |
| FR-007 | Offline full-text search            | implemented | packages/search-engine/src/index.test.ts, apps/desktop-electron/e2e/source.spec.ts                                                                                                                               |
| FR-008 | Packaged reader startup             | implemented | apps/desktop-electron/e2e/source.spec.ts, scripts/packaged-smoke.mjs                                                                                                                                             |
| FR-009 | Reading statics                  | implemented | packages/content-engine/src/index.test.ts                                                                                                                                                                        |
| FR-010 | Safe internal navigation            | implemented | apps/desktop-electron/e2e/source.spec.ts                                                                                                                                                                         |
| FR-011 | Typed desktop boundary              | implemented | packages/platform-contracts/src/index.test.ts, apps/desktop-electron/tests/security.spec.ts                                                                                                                      |
| FR-012 | Sanitized article rendering         | implemented | apps/desktop-electron/e2e/source.spec.ts                                                                                                                                                                         |
| FR-013 | Accessible code copy                | implemented | apps/desktop-electron/src/renderer/copy-code.test.ts, apps/desktop-electron/e2e/source.spec.ts                                                                                                                   |
| FR-014 | Lazy Mermaid diagrams               | implemented | apps/desktop-electron/src/renderer/mermaid-renderer.test.ts, apps/desktop-electron/e2e/mermaid.spec.ts                                                                                                           |
| FR-015 | Lazy syntax highlighting            | implemented | apps/desktop-electron/src/renderer/syntax-highlight.test.ts, apps/desktop-electron/e2e/syntax-highlight.spec.ts                                                                                                  |
| FR-016 | Accessible footnotes                | implemented | packages/renderer-ui/src/index.test.ts, apps/desktop-electron/e2e/footnotes.spec.ts                                                                                                                              |
| FR-017 | Reader preferences                  | implemented | apps/desktop-electron/src/renderer/preferences.test.ts, apps/desktop-electron/e2e/preferences.spec.ts                                                                                                            |
| FR-018 | Semantic reading history            | implemented | apps/desktop-electron/src/renderer/navigation-history.test.ts, apps/desktop-electron/e2e/navigation-history.spec.ts                                                                                              |
| FR-019 | Persistent desktop layout           | implemented | apps/desktop-electron/src/renderer/layout-preferences.test.ts, apps/desktop-electron/src/main/window-state.test.ts, apps/desktop-electron/e2e/resizable-layout.spec.ts                                           |
| FR-020 | Native commands and Command Palette | implemented | packages/platform-contracts/src/desktop-command.test.ts, apps/desktop-electron/src/renderer/desktop-commands.test.ts, apps/desktop-electron/e2e/command-palette.spec.ts                                          |
| FR-021 | Validated local workspaces          | implemented | packages/content-engine/src/index.test.ts, apps/desktop-electron/src/main/workspace-state.test.ts, packages/platform-contracts/src/workspace-contract.test.ts, apps/desktop-electron/e2e/local-workspace.spec.ts |
| FR-022 | About and build information         | implemented | apps/desktop-electron/e2e/source.spec.ts                                                                                                                                                                         |
| FR-023 | Windows release artifacts           | implemented | .github/workflows/desktop-ci.yml, scripts/release-assets.mjs, scripts/packaged-smoke.mjs                                                                                                                         |

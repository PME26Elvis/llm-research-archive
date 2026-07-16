---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0001
  - ADR-0004
  - ADR-0007
  - ADR-0009
  - ADR-0018
  - ADR-0019
  - ADR-0020
---

# Testing Strategy

Research Observatory uses layered verification. A feature is complete only when its local contract, architectural boundary, real Electron journey, and packaged behavior have the evidence appropriate to that change.

## Permanent quality layers

| Layer | Command or artifact | Responsibility |
| --- | --- | --- |
| Formatting | `npm run format:check` | Deterministic source and workflow formatting. |
| Architecture | `npm run lint` | Dependency direction and Electron leakage rules. |
| TypeScript | `npm run typecheck` | Strict compile-time contracts across workspaces. |
| Traceability | `npm run validate:traceability` | Product Spec, YAML, Acceptance Matrix, and evidence stay synchronized. |
| Generated content | `npm run validate:generated` | Reproducible manifests and a clean worktree. |
| Release assets | `npm run validate:release-assets` | Versioning, platform names, manifest, checksums, SBOM, and release workflow invariants. |
| Enforced coverage | `npm run test:coverage` | Unit/contract/compatibility behavior plus package and overall thresholds. |
| Security | `npm run test:security` | Electron isolation, CSP, navigation, permissions, and preload authority. |
| Accessibility | `npm run validate:accessibility` plus Electron E2E | WCAG contrast/source rules and real keyboard/zoom/reduced-motion journeys. |
| Dependency governance | `npm run validate:dependencies` | Inventory, production-only audit, and bounded exceptions. |
| Search benchmark | `npm run benchmark:search` | 1k/10k serialization, query, filter, and renderer-block budgets. |
| Production build | `npm run build` | Bundled archive and Electron production output compile together. |
| Renderer footprint | `npm run validate:footprint:renderer` | Initial renderer JavaScript remains under 2 MiB gzip. |
| Electron E2E | `npm run test:e2e` | Complete user journeys inside the real Electron runtime, including localization, persistence, source rendering, and bundled Mermaid corpus compatibility. |
| Packaged smoke | `npm run smoke:packaged` | Windows, Linux, macOS arm64, and macOS x64 packages launch and expose expected build data. |
| Installed footprint | `npm run validate:footprint:package` | Each packaged root stays below 2 GiB and excludes repository-private or secret material. |

`npm run verify` is the repository-owned local quality gate. Desktop CI then runs Electron E2E and the four native package-smoke matrices on the same final PR head SHA. The reusable release workflow repeats `verify`, native make, packaged smoke, and package-footprint checks so a manual release cannot bypass PR policy.

## Electron E2E isolation and diagnostics

Playwright uses one Electron worker. The shared `electron-test.ts` fixture owns launch, stdout/stderr and renderer error capture, trace collection, screenshots, shutdown, and temporary workspace cleanup. Failures upload `playwright-e2e.log`, `playwright-report/`, and `test-results/` for 14 days.

## Coverage rule

Every behavior adds the lowest-cost deterministic test that proves its contract. Parsing belongs in unit tests; DTOs require contract tests; renderer focus and accessibility require renderer/Electron evidence; filesystem, preload, IPC, navigation, recovery, and packaged-runtime behavior require Electron or packaged smoke. Tests and thresholds are not weakened merely to obtain a green run.

## Mermaid compatibility coverage

Mermaid source normalization, explicit parse-before-render behavior, strict initialization, SVG allowlisting, executable-content removal, and invalid-output rejection are unit-tested. Electron E2E exercises multiple diagram families, source disclosure, security stripping, invalid-source fallback, and every fenced Mermaid block currently checked into `docs/`. A new repository diagram therefore becomes part of the executable compatibility surface without maintaining a duplicate fixture list.

## Localization and release-description coverage

Translation dictionaries are type-complete at compile time and unit-tested in both locales with interpolation. Preference tests cover schema migration and supported locale values. Main-process tests cover native labels; security tests preserve renderer/main authority; Electron E2E proves immediate application, focus restoration, native menu updates, restart persistence, and switching back to Traditional Chinese. Release-description tests cover accepted separators, Markdown bullets, deduplication, bounds, workflow wiring, and draft refresh behavior.

## Proposed Astro migration coverage

ADR-0020 remains proposed. Its implementation must add a legacy/candidate renderer matrix rather than replacing evidence prematurely. The migration specification requires static-output URL validation, offline chunk checks, current Electron journeys against the candidate, four-platform packaged evidence, accessibility parity, corpus compatibility, startup/footprint comparison, and a tested renderer-selection rollback. Astro behavior is not accepted or traceable until those gates exist and pass.

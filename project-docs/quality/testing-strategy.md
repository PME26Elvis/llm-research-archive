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
  - ADR-0021
---

# Testing Strategy

Research Observatory uses layered verification. A feature is complete only when its local contract, architectural boundary, real Electron journey, and packaged behavior have the evidence appropriate to that change.

## Permanent quality layers

| Layer | Command or artifact | Responsibility |
| --- | --- | --- |
| Formatting | `npm run format:check` | Deterministic source and workflow formatting. |
| Architecture | `npm run lint` | Dependency direction and Electron leakage rules. |
| TypeScript and Astro | `npm run typecheck` | Strict TypeScript contracts plus `astro check` across the static renderer. |
| Public documentation | `python -m mkdocs build --strict` in Desktop CI and release preflight | Installs the pinned Python requirements, regenerates word counts, and proves the public About / Deep Research route, navigation metadata, plugins, and links build under strict mode. |
| Guide integrity | `npm run validate:guide` | Canonical schemas, source resolution, neutrality rules, public snapshot, record counts, and deterministic digests. |
| Traceability | `npm run validate:traceability` | Product Spec, YAML, Acceptance Matrix, and evidence stay synchronized. |
| Generated content | `npm run validate:generated` | Reproducible manifests and a clean worktree. |
| Release assets | `npm run validate:release-assets` | Versioning, platform names, manifest, checksums, SBOM, and release workflow invariants. |
| Enforced coverage | `npm run test:coverage` | Unit/contract/compatibility behavior plus package and overall thresholds. |
| Security | `npm run test:security` | Electron isolation, CSP, navigation, permissions, and preload authority. |
| Accessibility | `npm run validate:accessibility` plus Electron E2E | WCAG contrast/source rules and real keyboard/zoom/reduced-motion journeys. |
| Dependency governance | `npm run validate:dependencies` | Inventory, production-only audit, and bounded exceptions. |
| Search benchmark | `npm run benchmark:search` | 1k/10k serialization, query, filter, and renderer-block budgets. |
| Production build | `npm run build` | Bundled archive, Classic Vite output, Astro static output, local asset rewriting, CSP validation, and Electron packaging compile together. |
| Renderer footprint | `npm run validate:footprint:renderer` | Astro and Classic initial JavaScript each remain under 2 MiB gzip. |
| Electron E2E | `npm run test:e2e` | Complete user journeys run against Astro by default and explicitly switch to Classic and back while preserving localization, persistence, source rendering, and bundled Mermaid corpus compatibility. |
| Packaged smoke | `npm run smoke:packaged` | Every native package launches Astro, switches to Classic, switches back, and exposes expected build data. |
| Installed footprint | `npm run validate:footprint:package` | Each packaged root stays below 2 GiB and excludes repository-private or secret material. |

`npm run verify` is the repository-owned local quality gate. Desktop CI then runs Electron E2E and the four native package-smoke matrices on the same final PR head SHA. Desktop CI also runs a strict MkDocs build before the JavaScript quality gates. The reusable release workflow repeats the same public-site build, `verify`, native make, packaged smoke, and package-footprint checks so a manual release cannot bypass PR policy.

## Electron E2E isolation and diagnostics

Playwright uses one Electron worker. The shared `electron-test.ts` fixture owns launch, stdout/stderr and renderer error capture, trace collection, screenshots, shutdown, and temporary workspace cleanup. Failures upload `playwright-e2e.log`, `playwright-report/`, and `test-results/` for 14 days. Unsafe-link coverage activates a real link rendered from temporary article Markdown and verifies the warning, unchanged app-shell location, and continued article state.

## Coverage rule

Every behavior adds the lowest-cost deterministic test that proves its contract. Parsing belongs in unit tests; DTOs require contract tests; renderer focus and accessibility require renderer/Electron evidence; filesystem, preload, IPC, navigation, recovery, and packaged-runtime behavior require Electron or packaged smoke. Tests and thresholds are not weakened merely to obtain a green run.

## Mermaid compatibility coverage

Mermaid source normalization, explicit parse-before-render behavior, strict initialization, SVG allowlisting, executable-content removal, and invalid-output rejection are unit-tested. Electron E2E exercises multiple diagram families, source disclosure, security stripping, invalid-source fallback, and every fenced Mermaid block currently checked into `docs/`. A new repository diagram therefore becomes part of the executable compatibility surface without maintaining a duplicate fixture list.

## Localization and release-description coverage

Translation dictionaries are type-complete at compile time and unit-tested in both locales with interpolation. Preference tests cover schema migration and supported locale values. Main-process tests cover native labels; security tests preserve renderer/main authority; Electron E2E proves immediate application, focus restoration, native menu updates, restart persistence, and switching back to Traditional Chinese. Release-description tests cover accepted separators, Markdown bullets, deduplication, bounds, workflow wiring, and draft refresh behavior.

## Dual-renderer coverage

ADR-0020 is accepted and implemented. `scripts/astro-output.test.ts` verifies deterministic root-relative rewriting, Vite module-preload rebasing for packaged `file:` execution, narrowly scoped `style-src-attr` support for Mermaid, and rejection of remote or missing assets. `scripts/validate-astro-output.mjs` checks the generated Astro entry, hash-based CSP, local client modules, file-relative preload resolution, shell markers, and absence of remote runtime URLs. Main state and platform-contract tests cover the finite implementation set and atomic persistence. The complete existing Electron journey runs against Astro by default, and `renderer-implementations.spec.ts` proves bidirectional entry switching. Packaged smoke repeats the switch inside each Windows, Linux, macOS arm64, and macOS x64 artifact. Footprint reports retain separate measurements so a shared package cannot hide an oversized entry.


## Deep Research Guide coverage

`packages/deep-research-guide/src/index.test.ts` verifies both locale documents, stable IDs, official-source resolution, deterministic serialization, digest sensitivity, and structural parity. `scripts/validate-deep-research-guide.mjs` performs editorial and public-document validation outside unit tests. Astro output tests prove that official HTTPS anchors are allowed without admitting remote runtime assets.

`deep-research-guide.spec.ts` exercises versioned onboarding, header and native Help entry, article-state retention, focus restoration, both locale bodies, the dated timeline, DeepSeek naming asymmetry, official source links, Astro/Classic switching, and digest/count parity. Packaged smoke opens and closes each renderer's Guide and repeats canonical parity in every native artifact.

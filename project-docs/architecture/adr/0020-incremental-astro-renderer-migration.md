---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0001
  - ADR-0002
  - ADR-0004
  - ADR-0008
  - ADR-0016
  - ADR-0018
  - ADR-0019
---

# ADR-0020: Incremental Astro renderer migration

## Context

The current Electron renderer is a React application built directly with Vite. It has mature offline content, search, import, preferences, accessibility, diagnostics, localization, Mermaid, and release behavior, but the top-level renderer has grown into a large continuously hydrated application shell. The next frontend generation should support a clearer component system, more modern information architecture, selective hydration, and a safer incremental redesign without reopening the Electron security boundary.

The principal alternatives are:

1. Continue restructuring only inside the current React/Vite renderer.
2. Rewrite the renderer in Astro in place.
3. Add Astro as a side-by-side static renderer, initially host the existing React application through the official integration, then decompose behavior into islands.
4. Replace Electron with an Astro website or SSR application.
5. Use Astro Content Collections as the runtime source for all bundled and local workspaces.

An in-place rewrite makes rollback and parity review difficult. A browser or server product changes the product boundary. Build-time collections cannot own user-selected workspaces that change after packaging.

## Decision

Adopt option 3 as the implemented dual-renderer architecture.

Create `apps/desktop-astro/` as a side-by-side static renderer. Preserve the existing Electron main process, preload bridge, typed platform contracts, canonical Markdown Content Engine, Search Engine, Application layer, local workspace model, import transactions, and release pipeline.

Use Astro for the static application shell, layouts, presentational components, and local production assets. Use the official React integration to host current components during migration. Hydrate only interaction domains that require client state through explicit islands.

The migration must begin with a packaged `file:`-compatibility and asset-path spike on Windows, Linux, macOS arm64, and macOS x64. The exact Astro path configuration is selected from that evidence and enforced by a production-output validator.

Content Collections may validate bundled/reference content at build time, but they do not replace the runtime Content Engine or read arbitrary local workspaces.

Astro is the default renderer and the Classic renderer remains a first-class packaged compatibility entry. The application exposes a finite typed switch in renderer chrome and the native menu, persists the selection in a versioned local state document, and recovers to the previous renderer on load failure. Both entries are exercised by Electron E2E and packaged smoke; Classic retirement is not implied by Astro becoming the default.

The detailed implementation contract is `project-docs/migration/astro-frontend-refactor-spec.md`.

## Consequences

### Benefits

- Astro can provide static-first shell rendering and selective hydration without discarding proven React behavior.
- Side-by-side development keeps routine fixes and releases independent from the migration.
- Existing Electron authority and offline guarantees remain stable.
- Each interaction island can be measured and reviewed rather than accepting a fully hydrated shell by default.
- Cutover can be compared against the same content fixtures, tests, and package pipeline.
- Rollback does not require reverting unrelated domain or content changes.

### Costs

- Two renderer applications coexist during the migration.
- Build, test, dependency, and package tooling temporarily become more complex.
- Shared state across islands requires an explicit typed ownership model.
- Astro production asset paths must be proven under packaged local loading rather than assumed from web deployment defaults.
- Some current React components will need adapters before they can be decomposed cleanly.
- Content schemas require discipline to avoid duplicating Content Engine parsing.

### Rejected outcomes

- No SSR adapter or local HTTP server is introduced.
- No remote CDN or runtime network dependency is introduced.
- No big-bang renderer replacement is accepted.
- No requirement is marked implemented merely because an Astro shell exists.
- React is not removed for ideological reasons; conversion requires a product, performance, or maintainability benefit.

## Implementation evidence

- `apps/desktop-astro/` produces deterministic static output with a hash-based Astro CSP and repository-owned `file:` asset validation.
- `apps/desktop-electron/src/main/renderer-state.ts` owns the default, persistence, environment override, and atomic state writes.
- `packages/platform-contracts/src/renderer-implementation.test.ts` constrains implementation names and switch payloads.
- `apps/desktop-electron/e2e/renderer-implementations.spec.ts` proves Astro default launch and bidirectional switching.
- `scripts/packaged-smoke.mjs` starts the installed app and opens both entries on every native target.
- `scripts/verify-footprint.mjs renderer` enforces a separate 2 MiB gzip initial-JavaScript ceiling for each implementation.
- The existing corpus, accessibility, localization, workspace, import, search, Mermaid, diagnostics, and navigation journeys run against Astro by default and therefore remain parity evidence.

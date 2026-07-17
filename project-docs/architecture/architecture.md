---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0001
  - ADR-0004
  - ADR-0016
  - ADR-0017
  - ADR-0018
  - ADR-0020
---

# Architecture

The dependency direction is Domain -> Content/Search Engines -> Application -> Platform Contracts -> Electron adapters and Renderer. Electron remains an adapter: main owns filesystem, workspace, import transactions, search-index lifecycle, startup telemetry, local diagnostics, native menu, packaging, and release authority; renderer receives validated DTOs and emits typed commands through preload.

Canonical Markdown remains the source of truth. Content Engine produces article summaries, revision dates, reading statistics, diagnostics, manifests, and deterministic import plans. Search Engine owns a serializable incremental index. Renderer builds browsing, reading, Observatory summaries, preferences, navigation history, and accessible dialogs without direct Node or filesystem access.

The desktop package now retains two renderer adapters. `apps/desktop-astro/` is the default static Astro entry and `apps/desktop-electron/src/renderer/` is the packaged Classic React/Vite compatibility entry. Both consume the same validated DTOs and typed preload API; neither owns filesystem, search-index, import, native-menu, or release authority. Astro owns the document shell and modern presentation while the official React integration hosts shared proven interaction domains. Main owns a bounded renderer preference, exposes a finite typed switch, and recovers to the previous entry if loading fails. ADR-0020 and `project-docs/migration/astro-frontend-refactor-spec.md` record the completed migration contract.

Architecture, traceability, coverage, accessibility, dependency, performance, renderer-footprint, Electron E2E, and four-platform packaged-smoke gates are repository-enforced boundaries rather than optional documentation conventions.

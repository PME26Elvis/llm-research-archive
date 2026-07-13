---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0001
  - ADR-0004
  - ADR-0016
  - ADR-0017
  - ADR-0018
---

# Architecture

The dependency direction is Domain -> Content/Search Engines -> Application -> Platform Contracts -> Electron adapters and Renderer. Electron remains an adapter: main owns filesystem, workspace, import transactions, search-index lifecycle, startup telemetry, local diagnostics, native menu, packaging, and release authority; renderer receives validated DTOs and emits typed commands through preload.

Canonical Markdown remains the source of truth. Content Engine produces article summaries, revision dates, reading statistics, diagnostics, manifests, and deterministic import plans. Search Engine owns a serializable incremental index. Renderer builds browsing, reading, Observatory summaries, preferences, navigation history, and accessible dialogs without direct Node or filesystem access.

Architecture, traceability, coverage, accessibility, dependency, performance, renderer-footprint, Electron E2E, and four-platform packaged-smoke gates are repository-enforced boundaries rather than optional documentation conventions.

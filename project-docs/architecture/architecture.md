---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0001
---

# Architecture

Packages are layered: domain, content-engine/search-engine, application, platform-contracts, Electron adapters and renderer. Electron is only an adapter. Renderer communicates through validated preload APIs.

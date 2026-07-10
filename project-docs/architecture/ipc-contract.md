---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0001
---

# IPC Contract

IPC channels accept JSON DTOs only: archive:list, article:get, search:query, workspace:select, import:preview, import:commit, diagnostics:get, preferences:get, preferences:set, app:info, external:open. Payloads are validated before use.

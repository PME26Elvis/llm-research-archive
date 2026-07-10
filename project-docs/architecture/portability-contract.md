---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0001
---

# Portability Contract

Shared packages domain, content-engine, search-engine, application and renderer-ui are reusable. Electron adapters implement filesystem, dialogs, shell, preferences and app info. A future Tauri adapter replaces apps/desktop-electron main/preload while reusing manifests, DTOs and use cases.

| Capability | Shared Package | Electron Adapter | Future Tauri Adapter |
| --- | --- | --- | --- |
| Read archive | application/content-engine | Node filesystem | Tauri fs command |
| Open external link | platform-contracts | Electron shell | Tauri opener |
| Choose workspace | platform-contracts | Electron dialog | Tauri dialog |
| Preferences | application | Electron userData adapter | Tauri app data adapter |
| Search | search-engine | shared | shared |
| Markdown rendering | renderer-ui | shared | shared |
| Import transaction | application | Node filesystem adapter | Rust/Tauri adapter |

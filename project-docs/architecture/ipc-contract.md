---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0004
  - ADR-0015
  - ADR-0016
  - ADR-0017
  - ADR-0018
  - ADR-0019
  - ADR-0020
---

# IPC Contract

IPC accepts and returns schema-validated JSON DTOs only. Main validates sender origin before performing privileged work. Current capabilities cover archive list/article/search, workspace select/info, import source selection/preview/commit, diagnostics read/clear/report, startup milestones, preferences, app/build information, external links, and typed desktop commands.

Renderer never receives unrestricted filesystem paths or reusable write authority. Import previews are sanitized and keyed by opaque plan IDs held in main. Diagnostics return bounded redacted events and aggregate startup timing, not raw logs. Menu shortcuts and Command Palette share the same command allowlist.

## Locale update boundary

`preferences:set-locale` accepts only `UiLocaleSchema` values (`zh-TW` or `en`). The renderer retains the user-facing `system` preference and resolves it locally; main receives only the resolved allowlisted locale needed to rebuild the application menu and localize native dialogs. The call grants no filesystem path, article content, or generic menu-construction capability.


## Renderer implementation boundary

`renderer:info` returns the active implementation, the Astro default, and the finite packaged set. `renderer:set` accepts only `RendererImplementationUpdateRequestSchema` with `astro` or `classic`. Main resolves those identifiers to repository-owned local entries, performs the load, persists the selection atomically only after success, rebuilds the native menu, and attempts recovery to the previous entry on failure. The renderer never supplies a URL, path, script, or arbitrary implementation name.

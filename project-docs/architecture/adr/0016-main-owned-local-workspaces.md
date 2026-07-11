---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0001
  - ADR-0015
---

# ADR-0016: Main-owned local workspace boundary

## Context

The packaged reader previously opened only bundled content or a development-only environment root. Users need to choose a local archive, keep it across restarts, recover from moved folders, and diagnose individual bad files without exposing arbitrary filesystem access to the renderer.

## Decision

The Electron main process exclusively owns workspace paths. A native directory chooser returns no path argument from renderer code. Main resolves the selected root with `realpath`, requires an absolute readable directory with at least one valid formal article, persists the root atomically under `userData`, and rebuilds the complete application snapshot before returning a typed workspace result.

The content engine performs a diagnostic scan: symlinks and path escapes are skipped, malformed articles are isolated, and broken internal links or missing local assets are reported. The active root also drives the existing `app-asset` resolver. If a persisted workspace is missing or invalid at startup, the app clears it and falls back to bundled content with a visible recovery warning.

The renderer may display the validated root from the workspace DTO for user transparency, but it never supplies that displayed value back as authority. Every new selection originates in the native chooser and is revalidated by main before activation.

## Consequences

- Renderer gains fixed `workspaceInfo` and `selectWorkspace` methods, not a generic path or filesystem API.
- One bad article cannot prevent valid content from loading.
- Search, manifest, diagnostics, article list, and local assets switch to the new main-owned root.
- Symlinked content is deliberately unsupported until a more granular trust policy is designed.

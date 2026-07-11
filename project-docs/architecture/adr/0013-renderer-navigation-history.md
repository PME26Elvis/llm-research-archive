---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0001
  - ADR-0012
---

# ADR-0013: Renderer-owned navigation history

## Context

The offline reader could open articles and fragments without leaving the Electron shell, but it had no explicit history model. Browser history is not suitable because the packaged renderer uses one trusted document URL and navigation away from that URL is intentionally blocked.

## Decision

Keep a bounded, renderer-owned stack of semantic locations. Each location contains the selected article and fragment plus the search, browse mode, and selected facet that produced the visible list. Article and fragment navigation push entries; transient search typing replaces the current entry; navigating after Back truncates the forward branch.

Expose Back and Forward controls in the reader and support `Alt+Left` and `Alt+Right`. Applying a location restores list state and loads the article through the existing typed preload API. The BrowserWindow URL, preload surface, IPC channels, filesystem permissions, and external navigation policy remain unchanged.

## Consequences

- Navigation is deterministic and unit-testable without coupling to Chromium history.
- Search and facet context are restored together with article position.
- The stack is capped at 100 entries to avoid unbounded session growth.
- Native menu commands can dispatch the same semantic actions in a later change without owning navigation state.

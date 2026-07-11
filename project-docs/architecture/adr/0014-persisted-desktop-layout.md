---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0012
  - ADR-0013
---

# ADR-0014: Persisted renderer pane and native window layout

## Context

The desktop reader used a fixed 360 px navigation column and always opened at 1280 × 840. Research archives vary significantly in title length, display size, and preferred reading width. A desktop shell should restore those choices without granting renderer access to native window APIs.

## Decision

Persist renderer pane width and collapsed state in a dedicated versioned localStorage document. Clamp width to 240–620 px and expose a WAI-ARIA separator supporting pointer drag plus Arrow, Home, and End keys.

Persist native BrowserWindow normal bounds and maximized state in an atomic JSON file under Electron `userData`. Validate minimum dimensions, cap dimensions to the primary work area, and recenter windows that no longer overlap an attached display. The renderer receives no new IPC or preload capability.

## Consequences

- Pane and window layout survive a full application restart.
- Corrupt or obsolete state falls back safely.
- Multi-monitor disconnection cannot strand the window off screen.
- Future multi-pane views can reuse the versioned layout boundary without mixing it with reading-theme preferences.

---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-requirements:
  - FR-017
  - NFR-004
  - NFR-022
---

# ADR-0012: Versioned renderer preferences

## Context

The desktop reader needs system, light, and dark appearance modes plus a persistent article text-size preference. These settings affect only presentation and do not require filesystem access, secrets, cross-window coordination, or privileged Electron APIs. The implementation must avoid exposing a generic IPC preference store while still providing schema migration and recovery from malformed data.

## Decision

Store a versioned `ReaderPreferences` JSON document in the renderer origin's localStorage:

```ts
interface ReaderPreferences {
  schemaVersion: 1;
  theme: 'system' | 'light' | 'dark';
  textScale: number;
}
```

The adapter validates theme values, rounds and clamps text scale to 0.8–1.4, migrates the earlier `fontScale` shape if encountered, and backs up malformed JSON under a separate corruption key before resetting to defaults.

Resolved appearance is applied to the root document through `data-theme-preference`, `data-theme`, `color-scheme`, and `--reader-text-scale`. System mode listens to `prefers-color-scheme` changes. Theme colors are repository-owned CSS custom properties shared by the shell, modal, code, syntax highlighting, Mermaid container, and footnotes.

The settings dialog provides labelled radio controls, text-size controls, Escape handling, a focus trap, and focus restoration. Windows/Linux keyboard shortcuts use `Ctrl++`, `Ctrl+-`, and `Ctrl+0`.

Mermaid uses the resolved theme when rendering. An in-app theme-change event causes already-rendered diagrams to rerender through the existing strict sanitizer; offscreen pending diagrams use the current theme when they first enter the viewport.

## Alternatives considered

### Generic preferences IPC backed by files in `userData`

Deferred. A main-process adapter is appropriate when multiple windows or non-renderer settings require coordination, but it would add IPC schemas, handlers, filesystem writes, and a larger privileged surface for two origin-scoped presentation values.

### Browser default color scheme only

Rejected because users need an explicit override and a stable choice across restarts.

### Change the root browser zoom factor

Rejected because it scales navigation, dialogs, and controls together and can produce platform-dependent layout behavior. The current preference intentionally scales the article reading surface only.

### Unversioned localStorage keys

Rejected because independent keys provide no atomic migration boundary and make corruption recovery harder to reason about.

## Consequences

- Theme and article text size survive packaged-app restarts without new IPC privileges.
- Corrupt data is recoverable and inspectable instead of crashing initialization.
- System theme changes are reflected immediately when the user selects system mode.
- Future preference schema changes require an explicit migration path.
- A future multi-window preferences service can implement the existing `PreferencesPort` without changing the preference domain shape.

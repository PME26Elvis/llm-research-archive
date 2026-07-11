---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0013
  - ADR-0014
---

# ADR-0015: Typed desktop command routing

## Context

Native menus, keyboard shortcuts, and a command palette must invoke the same application behavior. Passing arbitrary strings or Electron objects through preload would create multiple inconsistent command paths and expand the renderer capability surface.

## Decision

Define a finite `DesktopCommandSchema` in platform contracts. The main process builds the native menu from known IDs and sends only the `app:command` event. Preload validates every incoming value and ignores unknown IDs before invoking one registered renderer handler. Renderer keyboard shortcuts and the command palette execute the same typed IDs.

The initial catalog covers command-palette opening, search focus, semantic navigation Back/Forward, and About. Workspace commands are intentionally deferred until the workspace boundary exists.

## Consequences

- Native menu, shortcuts, and palette cannot drift into separate implementations.
- Unknown command strings cannot trigger arbitrary renderer actions.
- The preload surface adds one fixed event channel, not a generic IPC bridge.
- Future commands require an explicit contract, catalog entry, implementation, and tests.

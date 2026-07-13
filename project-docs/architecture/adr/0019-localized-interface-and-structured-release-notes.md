---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
---

# ADR-0019: Localized Interface and Structured Release Notes

## Context

Research Observatory shipped with a Traditional Chinese interface and a safe release pipeline, but language was not a persisted product preference and native Electron surfaces could not follow renderer text. Automated releases also used a generic description even when the operator knew the important changes.

## Decision

1. Keep Traditional Chinese as the backwards-compatible default and support `system`, `zh-TW`, and `en` preferences through a versioned renderer-owned schema.
2. Use type-complete dictionaries for application chrome. Research article content remains canonical and is not translated automatically.
3. Resolve `system` in the renderer, update `<html lang>` immediately, and send only the resolved allowlisted locale through validated IPC. Main remains the sole owner of native menus and dialogs.
4. Treat language switching as an accessibility and persistence journey: visible UI, focus restoration, native menu labels, restart persistence, and switching back require Electron E2E evidence.
5. Accept optional bounded release change items, normalize common list formats, and render one deterministic Markdown body for draft creation and refresh.

## Consequences

The UI can be switched without restart and remains consistent across renderer/native surfaces. Dictionaries add maintenance cost, but compile-time key coverage and E2E prevent partial locale drift. The renderer gains no native authority. Release descriptions become human-readable while remaining safe for unattended workflow execution. Future locales require complete evidence rather than ad hoc string patches.

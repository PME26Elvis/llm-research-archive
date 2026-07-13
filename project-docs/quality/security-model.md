---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0004
  - ADR-0016
  - ADR-0017
  - ADR-0018
  - ADR-0019
---

# Security Model

The Electron renderer runs with `contextIsolation`, sandboxing, disabled `nodeIntegration`, restrictive CSP, denied permissions, blocked untrusted navigation, and safe external-link handling. The main process owns filesystem, workspace, import, diagnostics, startup telemetry, and release-sensitive authority. Preload exposes only schema-validated JSON DTOs and sender-validated commands.

Local workspaces and assets are canonicalized and confined; import plans are read-only previews backed by opaque main-owned authority, source/asset fingerprints, locks, staging, post-write validation, atomic rename, rollback, and explicit source deletion. Content rendering is sanitized before it reaches the DOM.

Local diagnostics are bounded, atomically persisted, and redacted for configured private roots, absolute paths, authorization data, tokens, passwords, and secrets. They never contain article bodies or raw IPC payloads and can be inspected or cleared by the user. No diagnostics leave the device.

Dependency governance separates runtime and development tooling, inventories production packages, audits a production-only lockfile, and allows high/critical findings only through reviewed expiring exceptions. Packaged-output inspection rejects top-level repository internals and obvious credentials, secrets, private keys, or certificate-key files.

Language preferences remain local renderer state. The preload validates resolved locales before IPC, main accepts only the two supported locale identifiers, and native menu/dialog construction remains main-owned. Translation keys never execute code, article content is not sent to a translation service, and language switching introduces no network access or expanded filesystem authority.

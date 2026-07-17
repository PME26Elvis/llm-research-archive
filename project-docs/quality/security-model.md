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
  - ADR-0020
  - ADR-0021
---

# Security Model

The Electron renderer runs with `contextIsolation`, sandboxing, disabled `nodeIntegration`, restrictive CSP, denied permissions, blocked untrusted navigation, and safe external-link handling. The main process owns filesystem, workspace, import, diagnostics, startup telemetry, and release-sensitive authority. Preload exposes only schema-validated JSON DTOs and sender-validated commands.

Local workspaces and assets are canonicalized and confined; import plans are read-only previews backed by opaque main-owned authority, source/asset fingerprints, locks, staging, post-write validation, atomic rename, rollback, and explicit source deletion. Content rendering is sanitized before it reaches the DOM.

Local diagnostics are bounded, atomically persisted, and redacted for configured private roots, absolute paths, authorization data, tokens, passwords, and secrets. They never contain article bodies or raw IPC payloads and can be inspected or cleared by the user. No diagnostics leave the device.

Dependency governance separates runtime and development tooling, inventories production packages, audits a production-only lockfile, and allows high/critical findings only through reviewed expiring exceptions. Packaged-output inspection rejects top-level repository internals and obvious credentials, secrets, private keys, or certificate-key files.

Language preferences remain local renderer state. The preload validates resolved locales before IPC, main accepts only the two supported locale identifiers, and native menu/dialog construction remains main-owned. Translation keys never execute code, article content is not sent to a translation service, and language switching introduces no network access or expanded filesystem authority.


## Dual-renderer boundary

Astro and Classic are local renderer adapters, not independent trust domains. Both load only through main-owned allowlisted URLs and the same context-isolated preload. Renderer selection accepts only the `astro` or `classic` schema values, persists no arbitrary path or URL, and does not expose a generic reload or navigation capability. Astro build output is validated for local relative assets, absence of remote runtime URLs, required shell markers, and hash-authorized inline hydration scripts. A failed switch is recorded locally and returns to the previous entry.


## Deep Research Guide boundary

Guide content is bundled, immutable at runtime, schema-validated, and free of remote executable assets. `scripts/validate-deep-research-guide.mjs` rejects non-HTTPS official source URLs, unresolved source IDs, locale-shape divergence, unsupported provider naming, and loss of the DeepSeek negative finding. Astro production validation permits HTTPS evidence anchors but still rejects remote scripts, styles, frames, fonts, images, imports, fetches, and CSS URLs. Classic uses the same safe external-link bridge. Neither renderer fetches vendor content at runtime.

Vendor quality statements remain explicitly attributed; unavailable dates or model bindings remain unknown. The guide does not expose chain-of-thought, rank providers, infer article provenance, or elevate citation presence into a correctness guarantee.

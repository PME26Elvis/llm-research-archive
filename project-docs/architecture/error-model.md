---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0004
  - ADR-0017
  - ADR-0018
---

# Error Model

Application errors use a stable code, user-safe message, optional safe details, and an internal cause that is never serialized directly. Platform failures map to validation, not-found, permission-denied, conflict, corrupted-content, workspace-read-only, stale-plan, external-link-denied, or internal-error outcomes.

Import and workspace failures preserve the existing workspace and source by default. Transaction failures remove staging and lock residue before returning. Recoverable startup/workspace errors fall back to the bundled archive and write a redacted local diagnostic. Unexpected main or renderer failures are recorded in a bounded main-owned log; article bodies, raw IPC payloads, secrets, and full private paths are excluded.

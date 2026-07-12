---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-12
related-adrs:
  - ADR-0001
  - ADR-0016
---

# ADR-0017: Deterministic import plans and atomic publication

## Context

FR-002 requires users to inspect metadata, cleanup actions, assets, warnings, conflicts, and exact output files before any workspace mutation. Combining source discovery, normalization, preview, filesystem writes, rollback, and Electron presentation in one operation would make the safety boundary difficult to test and would allow UI or adapter code to bypass conflict checks.

## Decision

The content engine owns a platform-neutral import domain whose first operation is `createImportPlan`. It accepts a Markdown file or the constrained article-folder shape, validates real paths and rejects symbolic links, parses front matter, cleans repository-specific wrappers, infers or validates metadata, inventories assets, checks target confinement and conflicts, and returns a deterministic typed plan without writing or deleting anything.

Explicit category and slug values must already be lowercase English kebab-case. They are rejected rather than silently normalized when they contain traversal or ambiguous path syntax. Metadata that cannot be inferred safely produces a preview that requires confirmation and cannot be committed.

The plan contains generated article content, cleanup counts, copied-asset intent, output paths, warnings, conflicts, source and output SHA-256 fingerprints, and a stable content-derived plan ID. Absolute source and workspace paths are operational fields but are excluded from stable identity where possible.

`commitImportPlan` rebuilds and compares the plan immediately before writing, rejects stale source or asset content and late target conflicts, acquires an owned per-target lock, writes exclusively into a sibling staging directory, validates front matter, title, file inventory, sizes, and hashes, and then atomically renames the validated directory into place. Failures remove owned staging and lock artifacts and any newly-created empty category directory; a lock that belongs to another transaction is never removed.

Successful commit returns a receipt and retains the source. `removeImportedSource` is a separate explicit action that revalidates both committed output and source fingerprints before deletion, and refuses folders containing entries outside the supported import contract.

## Consequences

- Preview is deterministic, independently testable, and guaranteed to be write-free.
- Renderer and future CLI adapters can share one import contract instead of duplicating cleanup, path, commit, or rollback logic.
- Existing targets, path traversal, source or asset symlinks, malformed front matter, invalid explicit metadata, stale plans, concurrent commits, write failures, validation failures, and rename failures are handled before exposing partial output.
- Source deletion is never implicit and cannot proceed after either side of the receipt changes.
- PR #27 through PR #29 provide complete domain, typed Desktop, security, restart-persistence, and Electron E2E evidence; FR-002 is implemented.

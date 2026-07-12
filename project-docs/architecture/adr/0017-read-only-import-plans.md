---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-12
related-adrs:
  - ADR-0001
  - ADR-0016
---

# ADR-0017: Read-only deterministic import plans

## Context

FR-002 requires users to inspect metadata, cleanup actions, assets, warnings, conflicts, and exact output files before any workspace mutation. Combining source discovery, normalization, preview, filesystem writes, rollback, and Electron presentation in one operation would make the safety boundary difficult to test and would allow UI or adapter code to bypass conflict checks.

## Decision

The content engine owns a platform-neutral import domain whose first operation is `createImportPlan`. It accepts a Markdown file or the constrained article-folder shape, validates real paths and rejects symbolic links, parses front matter, cleans repository-specific wrappers, infers or validates metadata, inventories assets, checks target confinement and conflicts, and returns a deterministic typed plan without writing or deleting anything.

Explicit category and slug values must already be lowercase English kebab-case. They are rejected rather than silently normalized when they contain traversal or ambiguous path syntax. Metadata that cannot be inferred safely produces a preview that requires confirmation and cannot be committed.

The plan contains generated article content, cleanup counts, copied-asset intent, output paths, warnings, conflicts, and a stable content-derived plan ID. Absolute source and workspace paths are operational fields but are excluded from stable identity where possible.

Atomic publication is intentionally a separate operation for PR #28. It must revalidate the plan and current filesystem state, stage in a sibling temporary directory, validate the generated article, rename atomically, roll back failures, and retain the source unless a later explicit removal action succeeds.

## Consequences

- Preview is deterministic, independently testable, and guaranteed to be write-free.
- Renderer and future CLI adapters can share one import contract instead of duplicating cleanup or path logic.
- Existing targets, path traversal, source or asset symlinks, malformed front matter, and invalid explicit metadata are surfaced before publication.
- PR #27 provides partial FR-002 evidence only; FR-002 remains planned until atomic commit, rollback, typed Electron integration, and complete E2E are implemented.

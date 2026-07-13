---
status: proposed
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0007
  - ADR-0018
---

# Desktop Roadmap

## Current baseline

The offline desktop reader, safe importer, local workspaces, serialized search, Observatory, revision/word-count views, accessibility, startup telemetry, local diagnostics, four-platform packages, and draft-first release pipeline are implemented. Every current FR/NFR in the Product Spec is implemented and enforced by traceability and CI.

## Proposed next phase

These items are authorized for planning but are not yet traceable requirements. Before implementation, each receives stable IDs, explicit user journeys, threat/rollback analysis, and acceptance evidence.

1. **Signed distribution and notarization** — Windows Authenticode plus macOS Developer ID signing/notarization, secret isolation, signature verification, and documented unsigned fallback for forks.
2. **Secure updater** — opt-in update discovery, signed manifest/package verification, rollback, channel selection, and no silent background installation.
3. **Release provenance** — artifact attestations, dependency/license reports, reproducible provenance metadata, and verification instructions alongside SBOM/checksums.
4. **Quality trend history** — retain coverage, startup, search, renderer, package, and audit baselines across releases with regression summaries that do not create flaky wall-clock gates.
5. **Consented diagnostic export** — explicit user-reviewed export bundle with a manifest, redaction preview, bounded retention, and no automatic upload.
6. **Advanced offline retrieval** — ranking experiments beyond deterministic token matching while preserving serialized local indexes, bounded renderer work, explainability, and offline operation.

## Promotion rule

A proposal moves into the Product Spec only when scope, ownership, security boundary, migration/rollback behavior, platform matrix, and tests are concrete. Until then it remains `proposed`, not `planned`, so the completed requirement set remains truthful.

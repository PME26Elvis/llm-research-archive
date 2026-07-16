---
status: proposed
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0007
  - ADR-0018
  - ADR-0019
  - ADR-0020
---

# Desktop Roadmap

## Current baseline

The offline desktop reader, safe importer, local workspaces, serialized search, Observatory, revision/word-count views, accessibility, startup telemetry, local diagnostics, four-platform packages, draft-first release pipeline, switchable Traditional Chinese/English UI, localized native menus/dialogs, structured Markdown release descriptions, and strict corpus-tested Mermaid rendering are implemented. Every current FR/NFR in the Product Spec is implemented and enforced by traceability and CI.

## Proposed Astro frontend program

ADR-0020 and `project-docs/migration/astro-frontend-refactor-spec.md` define a proposed side-by-side Astro renderer migration. This is authorized architecture and product planning, not an implemented or planned requirement set.

The proposed sequence is:

1. **Integration spike** — prove static Astro output, local chunks/assets, preload trust, CSP, and four-platform packaged launch.
2. **Design foundation** — add repository-owned tokens, accessible primitives, and responsive workspace shell.
3. **Parity bridge** — host the current React renderer through the official Astro integration and run current journeys against both modes.
4. **Island decomposition** — split search, reader interactions, command palette, preferences, import, and Observatory into justified hydration domains.
5. **Modern workspace UX** — deliver the library rail, result pane, reading canvas, context inspector, compact layouts, and persisted layout migration.
6. **Cutover candidate** — synchronize requirements/evidence, publish a four-platform prerelease, and verify rollback.
7. **Production cutover** — select Astro by default; retire the legacy renderer only in a later PR after the rollback window.

Each phase uses focused branches targeting `app-main`, normal merge commits, retained branches, measurable exit gates, and synchronized documentation. Phase 0 must identify no unresolved architectural blocker before ADR-0020 can become accepted.

## Other proposed next-phase work

These items are authorized for planning but are not yet traceable requirements. Before implementation, each receives stable IDs, explicit user journeys, threat/rollback analysis, and acceptance evidence.

1. **Signed distribution and notarization** — Windows Authenticode plus macOS Developer ID signing/notarization, secret isolation, signature verification, and documented unsigned fallback for forks.
2. **Secure updater** — opt-in update discovery, signed manifest/package verification, rollback, channel selection, and no silent background installation.
3. **Release provenance** — artifact attestations, dependency/license reports, reproducible provenance metadata, and verification instructions alongside SBOM/checksums.
4. **Quality trend history** — retain coverage, startup, search, renderer, package, and audit baselines across releases with regression summaries that do not create flaky wall-clock gates.
5. **Consented diagnostic export** — explicit user-reviewed export bundle with a manifest, redaction preview, bounded retention, and no automatic upload.
6. **Additional interface locales** — add a locale only with a complete dictionary, native-label coverage, migration behavior, accessibility review, and real Electron persistence journey; article translation remains out of scope.
7. **Advanced offline retrieval** — ranking experiments beyond deterministic token matching while preserving serialized local indexes, bounded renderer work, explainability, and offline operation.

## Promotion rule

A proposal moves into the Product Spec only when scope, ownership, security boundary, migration/rollback behavior, platform matrix, and tests are concrete. Until then it remains `proposed`, not `planned`, so the completed requirement set remains truthful.

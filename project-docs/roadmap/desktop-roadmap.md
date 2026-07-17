---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0007
  - ADR-0018
  - ADR-0019
  - ADR-0020
  - ADR-0021
---

# Desktop Roadmap

## Current baseline

The offline desktop reader, safe importer, local workspaces, serialized search, Observatory, revision/word-count views, accessibility, startup telemetry, local diagnostics, four-platform packages, draft-first release pipeline, switchable Traditional Chinese/English UI, localized native menus/dialogs, structured Markdown release descriptions, strict corpus-tested Mermaid rendering, dual Astro/Classic renderer entries, and the bilingual offline Deep Research Guide are implemented. Every current FR/NFR in the Product Spec is implemented and enforced by traceability and CI.

## Completed Astro frontend program

ADR-0020 and `project-docs/migration/astro-frontend-refactor-spec.md` are implemented as a side-by-side renderer architecture:

1. Static Astro output loads from packaged `file:` URLs with local chunks and hash-authorized inline hydration scripts.
2. Astro provides the default document shell and modern responsive research-workspace presentation.
3. Shared React interaction domains preserve feature parity without duplicating search, reader, preferences, import, Observatory, or accessibility behavior.
4. Classic React/Vite remains packaged as an explicit compatibility and rollback entry.
5. Main owns a finite typed renderer selector, atomic persistence, native-menu integration, and load-failure recovery.
6. Unit tests cover output rewriting, CSP/output validation, state persistence, and DTO boundaries.
7. Electron E2E launches Astro by default and switches to Classic and back; native packaged smoke repeats the entry switch on all four targets.
8. Per-entry renderer footprints remain independently budgeted.

The two entries are implementations of the same product, not separate products, accounts, content stores, or release channels.


## Completed Deep Research Guide program

ADR-0021 and `project-docs/product/deep-research-guide-ui-spec.md` are implemented. A shared typed package supplies complete Traditional Chinese and English definitions, workflow, timeline, five provider profiles, neutral comparison, archive meaning, verification guidance, 15 official sources, and deterministic locale digests. Astro presents a static-first Guide workspace; Classic presents an accessible full-height Help Center overlay. Header, native Help, onboarding, empty-state, and article-provenance entry points preserve workspace state. FR-034 through FR-036 and NFR-028 through NFR-029 bind schema, neutrality, accessibility, Electron parity, and four-platform packaged evidence.

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

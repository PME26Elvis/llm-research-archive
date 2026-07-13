---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0001
  - ADR-0016
  - ADR-0017
  - ADR-0018
---

# Desktop Requirement Catalog

This catalog gives every traceable requirement a stable product name and defines the evidence required before a status changes. Requirement IDs remain the compatibility keys shared by `requirements.yaml`, the Product Spec, Acceptance Matrix, ADRs, tests, CI, and release evidence.

## Status rules

- `implemented` requires production code and concrete verification evidence.
- Future proposals stay outside the traceable requirement set until their scope and acceptance criteria are approved.
- Documents, mock interfaces, scaffolds, skipped tests, and green builds without the required journey are not implementation evidence.
- Status, traceability, acceptance evidence, parity documentation, and quality budgets change together.

## Functional convergence

### FR-002 — Safe article import and publishing

A user chooses a Markdown file or article folder, reviews a deterministic import plan, corrects metadata, confirms a writable target, and receives either a fully committed article or an unchanged workspace. The implementation provides write-free preview, constrained source shapes, cleanup and metadata normalization, source/asset fingerprints, sibling staging, post-write validation, atomic rename, rollback, immediate navigation, restart persistence, default source retention, and separately validated source removal.

Evidence: `packages/content-engine/src/article-import/index.test.ts`, `packages/content-engine/src/article-import/commit.test.ts`, `packages/platform-contracts/src/import-contract.test.ts`, `apps/desktop-electron/src/main/import-session.test.ts`, `apps/desktop-electron/tests/security.spec.ts`, and `apps/desktop-electron/e2e/import-wizard.spec.ts`.

## Implemented non-functional requirements

### NFR-010 — Enforced coverage thresholds

CI enforces overall 80% statements / 75% branches, Domain 95/90, Content Engine 90/85, and Application 90/85. The convergence baseline was overall 91.49/87.89, Domain 100/100, Content Engine 91.41/90.02, and Application 100/100.

### NFR-011 — Search and index performance

The main-owned search index supports deterministic serialization, hydration, upsert, removal, and facet filtering. CI benchmarks 1,000 and 10,000 synthetic articles with query/filter p95 at or below 100 ms and synchronous renderer work below 50 ms. The convergence baseline at 10,000 articles was 2.21 ms query p95, 0.48 ms filter p95, and 7.14 ms maximum synchronous renderer work.

### NFR-012 — Startup performance telemetry

Main and renderer record process start, app ready, archive ready, window created, renderer ready, and interactive milestones. Recent startup history is available through typed diagnostics, and Electron E2E enforces the three-second development target without external telemetry.

### NFR-013 — Bundle and footprint budgets

Initial renderer JavaScript is capped at 2 MiB gzip; the convergence baseline was 229.6 KiB. Native packages are measured after real packaged smoke on Windows x64, Linux x64, macOS arm64, and macOS x64. Because this is a small offline project, installed output uses a permissive 2 GiB hard ceiling rather than an optimization target. The scanner still rejects repository-only top-level roots and obvious secrets, credentials, private keys, and certificate-key material.

### NFR-014 — WCAG 2.2 AA desktop accessibility

Static policy checks contrast and required source patterns. Real Electron journeys cover keyboard-only navigation, skip links, visible focus, focus trapping/restoration, live regions, nonvisual Observatory tables, 200 percent zoom, dark/light presentation, and reduced motion.

### NFR-019 — Dependency governance

Runtime dependencies are separated from development tooling and recorded in a machine-checked inventory with owner, purpose, update cadence, execution boundary, license, native-module impact, and packaging impact. CI audits an isolated production-only lockfile. High or critical findings require a reviewed, bounded, expiring exception; the convergence baseline had zero production vulnerabilities and zero exceptions.

### NFR-025 — Local recovery and privacy-safe logging

Unexpected main, renderer, preference, search-index, workspace, and import failures produce typed actionable errors where possible and bounded local diagnostics otherwise. Diagnostics are main-owned, atomically persisted with restrictive permissions, redacted for secrets and private roots, exposed through validated DTOs, and viewable/clearable by the user. Article bodies and raw IPC payloads are never logged.

## Completed delivery sequence

PRs #27–#29 implemented the safe import domain, atomic transaction, Desktop Import Wizard, and complete E2E journey. PR #58 implemented the search index, startup telemetry, local diagnostics, revision/word-count presentation, and accessible Observatory. PR #73 converged coverage, accessibility, dependency, benchmark, renderer, package-footprint, and release gates. All traceable requirements are now implemented.

Future work is proposal-only and is maintained in `project-docs/roadmap/desktop-roadmap.md`; it does not create a new planned requirement until approved with stable IDs and acceptance evidence.

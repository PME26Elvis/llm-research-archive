---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0001
  - ADR-0018
---

# LLM Maintenance Playbook

Feature workflow: Requirement or approved roadmap proposal -> Product Spec -> ADR when the decision is architectural -> Contract -> deterministic test -> implementation -> traceability -> full CI. Bug workflow: reproduce -> regression test -> root cause -> minimal production fix -> `npm run verify` -> relevant Electron/package journey. IPC workflow: schema -> main authority -> preload bridge -> renderer client -> contract/security tests.

Before merge, confirm the final SHA passes formatting, architecture, TypeScript, traceability, generated content, release validation, enforced coverage, security, compatibility, WCAG policy, production dependency audit, search benchmark, build, renderer footprint, Electron E2E, and the affected native package smoke/footprint jobs.

Avoid MkDocs wrappers, Node in renderer, duplicated article types, unschematized IPC, renderer-owned paths or write authority, unbounded diagnostics, release matrix races, weakening tests to obtain green CI, and marking proposals as traceable requirements before stable IDs and acceptance criteria exist.

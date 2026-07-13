---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
---

# ADR-0018: Enforced Quality Gates and Local Observability

## Context

The desktop implementation had complete functional journeys, but several non-functional expectations remained prose-only: coverage, large-corpus search performance, startup timing, bundle/package footprint, accessibility, dependency governance, and privacy-safe recovery diagnostics. Optional documentation could not prevent regression or release bypass.

## Decision

1. Put deterministic coverage, accessibility, dependency, search-performance, build, and renderer-footprint commands in `npm run verify` and expose them as named Desktop CI steps.
2. Run Electron E2E after the quality job and run Windows x64, Linux x64, macOS arm64, and macOS x64 make, packaged smoke, and installed-footprint checks on native runners.
3. Repeat verify, native smoke, and installed footprint in the reusable release workflow.
4. Keep startup telemetry and diagnostics local and main-owned. Persist only bounded redacted events and expose view/clear controls through typed DTOs.
5. Use strict renderer and coverage budgets, but a permissive 2 GiB installed-package hard ceiling because package minimization is not a product goal. Size policy must not replace real packaged smoke.
6. Keep proposed future work outside the traceable requirement set until its requirement IDs and acceptance evidence are approved.

## Consequences

All current traceable requirements can be marked implemented from concrete evidence. CI duration and artifacts increase, but failures identify the responsible boundary. Local diagnostics improve recovery without introducing external telemetry. Native packages may remain relatively large; growth is bounded against release-asset failure and sensitive material is still rejected.

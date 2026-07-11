---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0001
  - ADR-0004
  - ADR-0007
  - ADR-0009
---

# Testing Strategy

Research Observatory uses layered verification. A feature is not complete when only its local unit tests pass; the repository also verifies architectural boundaries, runtime contracts, generated content, the production renderer, Electron behavior, and packaged executables.

## Verification layers

| Layer | Primary command or artifact | Responsibility |
| --- | --- | --- |
| Formatting | `npm run format:check` | Deterministic source and workflow formatting. |
| Architecture | `npm run lint` | Dependency direction and Electron leakage rules. |
| TypeScript | `npm run typecheck` | Strict compile-time contracts across workspaces. |
| Traceability | `npm run validate:traceability` | Product requirements, acceptance evidence, and verification artifacts stay synchronized. |
| Generated content | `npm run validate:generated` | Build-time manifests are reproducible and the working tree remains clean. |
| Release assets | `npm run validate:release-assets` | Artifact names, manifests, checksums, and release metadata remain valid. |
| Unit and contract tests | `npm run test` | Domain, application, platform-contract, content, search, and renderer behavior. |
| Security tests | `npm run test:security` | Electron isolation, CSP, navigation, permission, and preload boundaries. |
| Compatibility tests | `npm run test:compatibility` | Canonical Markdown parsing and corpus behavior. |
| Production build | `npm run build` | The bundled archive and Electron production package compile together. |
| Electron E2E | `npm run test:e2e` | User journeys execute inside the real Electron runtime. |
| Packaged smoke | `npm run smoke:packaged` | The Windows and Linux artifacts start and expose the expected packaged build information. |

`npm run verify` is the local read-only quality gate used by CI before Electron E2E and package-smoke jobs begin.

## Electron E2E isolation

Electron E2E tests run through `playwright.config.ts` with one worker. The suite intentionally does not run multiple Electron workers against the same downloaded executable and desktop session because that can produce operating-system-level executable contention such as Linux `ETXTBSY` failures. Several journeys also use the system clipboard, so process-level isolation is part of the test contract rather than a performance optimization.

The shared fixture in `apps/desktop-electron/e2e/electron-test.ts` owns:

- launching the pinned Electron executable with the requested test environment;
- collecting main-process stdout and stderr;
- collecting renderer console messages and uncaught page errors;
- starting a Playwright browser-context trace after the first window is ready;
- closing every Electron application after the test result is known;
- deleting registered temporary workspaces only after Electron has closed.

Tests should request `launchElectron` from the fixture instead of calling `_electron.launch` directly. This keeps cleanup and diagnostics consistent as the number of specs grows.

## Failure diagnostics

When an Electron E2E test fails, the fixture attempts to save and attach:

1. a full-page screenshot of the active Electron window;
2. a Playwright trace with screenshots, DOM snapshots, and sources;
3. captured main-process and renderer logs.

The CI E2E command also preserves the complete Playwright stdout and stderr stream with `tee` while retaining the original exit code through `pipefail`. The `Upload E2E diagnostics` step runs only after a failure and uploads:

- `playwright-e2e.log`;
- `playwright-report/`;
- `test-results/`.

Diagnostic artifacts are retained for 14 days. Missing diagnostic files produce a warning rather than hiding the original test failure, which is important when setup fails before Playwright creates a report.

## Pull-request gate

Changes targeting `app-main` must pass all of the following on the same final head SHA before merge:

1. the complete `quality` job;
2. the complete Electron E2E suite;
3. Windows x64 Forge make and packaged-app smoke;
4. Linux x64 Forge make and packaged-app smoke.

A rerun does not replace code review of an intermittent failure. Repeatedly flaky coverage should be stabilized at the test boundary or runtime boundary; tests must not be skipped, weakened, or given unbounded timeouts merely to obtain a green check.

## Adding coverage

Every new behavior should add the lowest-cost deterministic test that proves its contract, then add broader coverage when the behavior crosses a boundary:

- parsing and normalization belong in unit or compatibility tests;
- public ports and DTOs require contract tests;
- renderer interaction, focus, and accessibility require renderer tests or Electron E2E;
- filesystem, preload, IPC, navigation, and packaged-runtime behavior require Electron or packaged smoke verification;
- security-sensitive rendering requires both malicious-input unit cases and a real Electron journey.

The requirement status and acceptance matrix must reference the concrete test or verification artifact before a requirement is marked implemented.

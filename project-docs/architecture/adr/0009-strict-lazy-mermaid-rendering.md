---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0001
  - ADR-0004
  - ADR-0008
---

# ADR-0009: Strict, lazy Mermaid rendering

## Context

The canonical Markdown corpus contains fenced `mermaid` diagrams. The desktop reader must render them offline without loading MkDocs output, a CDN, an iframe, or remote executable content. Diagram source is content data and must not be treated as trusted HTML.

The main alternatives were:

1. Keep Mermaid fences as plain code. This preserves safety but does not meet FR-014.
2. Load Mermaid from a CDN. This violates offline operation, CSP, and the no-remote-CDN requirement.
3. Use `@mermaid-js/tiny`. Mermaid documents this package as CDN-oriented, not intended for normal npm installation, and it removes diagram families and internal lazy loading.
4. Implement a custom diagram parser. This would duplicate a complex grammar, reduce corpus compatibility, and create a larger long-term security and maintenance burden.
5. Install the official `mermaid` package and isolate it behind a strict renderer adapter.

## Decision

Use the exact `mermaid` version recorded in `package.json` and `package-lock.json`, loaded only from the packaged application through a dynamic import.

The renderer adapter must:

- call Mermaid with `startOnLoad: false` and `securityLevel: 'strict'`;
- disable flowchart HTML labels;
- render only fenced `language-mermaid` blocks;
- defer loading and rendering until a diagram approaches the viewport;
- pass generated SVG through a second repository-owned allowlist sanitizer;
- discard scripts, embedded documents, event handlers, external URLs, and non-fragment references;
- expose the final SVG as an image with an accessible name;
- retain the original Mermaid source in a disclosure element;
- show a recoverable error and open the source disclosure when rendering fails;
- respect reduced-motion preferences in diagram styling;
- introduce no IPC, preload capability, navigation permission, or network request.

## Consequences

### Benefits

- Existing Mermaid corpus renders in the independent Electron reader.
- Mermaid remains a replaceable renderer dependency rather than domain logic.
- Dynamic import prevents the Mermaid runtime from joining the initial renderer chunk.
- Strict mode and repository sanitization provide defense in depth.
- Invalid diagrams do not crash the reader or hide their source.

### Costs

- The packaged application and dependency graph become larger.
- Mermaid upgrades require explicit review, unit security tests, Electron E2E, and both native package-smoke jobs.
- New diagram types may require extending the SVG allowlist when verified safe.

## Verification

- `apps/desktop-electron/src/renderer/mermaid-renderer.test.ts`
- `apps/desktop-electron/e2e/mermaid.spec.ts`
- `apps/desktop-electron/tests/security.spec.ts`
- Windows and Linux packaged smoke jobs in `.github/workflows/desktop-ci.yml`

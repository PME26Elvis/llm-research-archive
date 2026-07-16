---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-17
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
- detect fenced Mermaid classes case-insensitively without treating ordinary code as a diagram;
- normalize a leading BOM, CRLF line endings, and surrounding fence whitespace before parsing;
- reject empty source and pre-parse valid source before rendering;
- defer loading and rendering until a diagram approaches the viewport;
- use both `IntersectionObserver` and a bounded viewport fallback so nested/late scroll containers cannot leave visible diagrams permanently pending;
- serialize Mermaid configuration and render calls because the library configuration is process-global;
- pass generated SVG through a second repository-owned allowlist sanitizer;
- preserve verified diagram geometry and styling attributes required by supported Mermaid families;
- discard scripts, embedded documents, event handlers, external URLs, and non-fragment references;
- expose the final SVG as an image with an accessible name;
- retain the original Mermaid source in a disclosure element;
- show a recoverable error and open the source disclosure when rendering fails;
- invalidate stale async work when an article unmounts or the theme changes;
- respect reduced-motion preferences in diagram styling;
- introduce no IPC, preload capability, navigation permission, or network request.

Renderer errors are recorded through the existing local diagnostics channel without including private article content.

## Consequences

### Benefits

- Existing Mermaid corpus renders in the independent Electron reader.
- Mermaid remains a replaceable renderer dependency rather than domain logic.
- Dynamic import prevents the Mermaid runtime from joining the initial renderer chunk.
- Strict mode and repository sanitization provide defense in depth.
- Invalid diagrams do not crash the reader or hide their source.
- BOM/CRLF content and multiple Mermaid diagram families receive real runtime coverage.
- A corpus-driven E2E test prevents newly added repository diagrams from silently rendering as permanent code fallbacks.

### Costs

- The packaged application and dependency graph become larger.
- Mermaid upgrades require explicit review, unit security tests, Electron E2E, and all native package-smoke jobs.
- New diagram types may require extending the SVG allowlist when verified safe.
- Corpus E2E grows with the number and complexity of checked-in diagrams.
- The lazy-render fallback adds bounded scroll/resize observation that must be cleaned up on article changes.

## Verification

- `apps/desktop-electron/src/renderer/mermaid-renderer.test.ts`
- `apps/desktop-electron/e2e/mermaid.spec.ts`
- `apps/desktop-electron/tests/security.spec.ts`
- bundled Markdown Mermaid-corpus journey in Electron E2E
- Windows, Linux, macOS arm64, and macOS x64 package-smoke jobs in `.github/workflows/desktop-ci.yml`

---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-requirements:
  - FR-016
  - NFR-004
  - NFR-022
---

# ADR-0011: Accessible Markdown footnotes

## Context

The canonical research corpus uses long-form Markdown where citations and explanatory notes should remain connected to their references. Plain markdown-it does not parse Pandoc-style footnotes. A desktop implementation must preserve offline operation, sanitized output, stable in-app fragment navigation, repeated references, keyboard focus, and screen-reader context.

## Decision

Use the MIT-licensed `markdown-it-footnote` 4.0.0 plugin in the platform-neutral renderer package. The plugin supports named definitions, multi-block notes, inline notes, and repeated references while remaining part of the existing markdown-it token pipeline.

Repository-owned renderer rules replace the default presentation with deterministic IDs:

- note items: `fn-1`, `fn-2`, ...;
- first references: `fnref-1`, `fnref-2`, ...;
- repeated references: `fnref-1-2`, `fnref-1-3`, ... .

The rules add Traditional Chinese accessible labels, a labelled footnote section, focusable note items, and distinct labels for each back-reference. The existing sanitizer explicitly allows only the tags, classes, IDs, labels, and `tabindex=-1` required by this semantic structure.

The Electron reader owns fragment behavior. Footnote links are intercepted inside the reader, never navigate the BrowserWindow, scroll their target into view, and move keyboard focus to the note or reference. Styling is local and uses visible focus indicators.

## Alternatives considered

### Render footnotes with regular links only

Rejected because definition syntax would remain visible text, repeated references would not receive unique back targets, and keyboard users would lose their reading position.

### Implement a custom footnote parser

Rejected because nested blocks, inline parsing, repeated references, and token ordering are established parser concerns. Reimplementing them would increase compatibility and security risk without product-specific benefit.

### Post-process raw rendered HTML

Rejected because string rewriting after Markdown rendering is fragile around nested content and would duplicate the parser's reference bookkeeping.

## Consequences

- Named, inline, multi-block, and repeated footnotes render consistently offline.
- Footnote markup remains inside the existing sanitize-html boundary.
- Same-page footnote navigation preserves the application URL and reading context.
- Future ID-format changes are compatibility-sensitive and require unit and Electron E2E updates.

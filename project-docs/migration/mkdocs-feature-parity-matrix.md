---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-adrs:
  - ADR-0008
  - ADR-0009
---

# MkDocs Feature Parity Matrix

| Existing Feature | Current Source | New Owner | Status | Tests | Rationale |
| --- | --- | --- | --- | --- | --- |
| Search | MkDocs/material | search-engine | implemented | packages/search-engine/src/index.test.ts; apps/desktop-electron/e2e/source.spec.ts | Offline desktop search returns complete DTOs. |
| Categories | canonical content paths | renderer-ui | implemented | packages/renderer-ui/src/browse.test.ts; apps/desktop-electron/e2e/source.spec.ts | Category facets are derived from article DTOs and filter entirely offline. |
| Tags | front matter | renderer-ui | implemented | packages/renderer-ui/src/browse.test.ts; apps/desktop-electron/e2e/source.spec.ts | Tag facets preserve article order, show counts, and combine with search. |
| Timeline | blog dates | renderer-ui | implemented | packages/renderer-ui/src/browse.test.ts; apps/desktop-electron/e2e/source.spec.ts | Month facets sort newest first and filter without navigation. |
| Word counts | hooks/word_counts.py | content-engine | implemented | packages/content-engine/src/index.test.ts | Python-compatible CJK/Latin count. |
| Reading time | hooks/word_counts.py | content-engine | implemented | packages/content-engine/src/index.test.ts | 500-display-unit rule. |
| Dark mode | CSS | renderer | planned | planned | Current styling is fixed dark reader. |
| Code copy | JS | renderer | implemented | apps/desktop-electron/src/renderer/copy-code.test.ts; apps/desktop-electron/e2e/source.spec.ts | Every fenced block receives a keyboard-accessible copy control, live feedback, Clipboard API handling, and a packaged-renderer fallback. |
| Syntax highlighting | MkDocs | renderer | implemented | apps/desktop-electron/src/renderer/syntax-highlight.test.ts; apps/desktop-electron/e2e/syntax-highlight.spec.ts | Registered local grammars highlight near the viewport without auto-detection, while unknown languages remain plain text. |
| Image lightbox | JS/CSS | renderer | implemented | apps/desktop-electron/e2e/source.spec.ts | Local article images are keyboard focusable, lazy-loaded, and open in an accessible modal with Escape and focus restoration. |
| Mermaid | MkDocs | renderer | implemented | apps/desktop-electron/src/renderer/mermaid-renderer.test.ts; apps/desktop-electron/e2e/mermaid.spec.ts | Fenced Mermaid diagrams load near the viewport with strict mode, a second SVG allowlist, accessible output, and a source fallback. |
| Footnotes | Markdown | renderer | implemented | packages/renderer-ui/src/index.test.ts; apps/desktop-electron/e2e/footnotes.spec.ts | Named, inline, multi-block, and repeated footnotes use deterministic accessible in-app navigation. |
| Internal links | Markdown | application/renderer | implemented | packages/content-engine/src/index.test.ts; apps/desktop-electron/e2e/source.spec.ts | Same-page and cross-article Unicode fragments remain inside the app shell. |
| Git revision date | plugin | manifest | planned | planned | Not in current reader UI. |
| Blog ordering | MkDocs | content-engine | implemented | packages/content-engine/src/index.test.ts | Date sorting for formal articles. |
| Observatory | docs page | renderer | planned | planned | Not in P1 reader slice. |
| Article import | publish_article.py | application | planned | planned | Not in P1 reader slice. |
| Citation cleanup | tools | content-engine/import | planned | planned | Import parity not implemented. |
| Category inference | tools | content-engine | implemented | packages/content-engine/src/index.test.ts | Canonical path category. |
| Slug generation | tools | content-engine | implemented | packages/content-engine/src/index.test.ts | Canonical path slug. |
| Assets copying | tools | application | planned | planned | Import flow not implemented. |
| Research appendix | tools | application | planned | planned | Import flow not implemented. |
| Generated word-count index | hook | manifest | planned | planned | Manifest exists; page generation not replaced. |
| GitHub Pages deployment | workflow | deploy.yml | preserved | .github/workflows/deploy.yml | Web deployment remains separate. |

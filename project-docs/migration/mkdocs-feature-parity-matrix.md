---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0008
---

# MkDocs Feature Parity Matrix

| Existing Feature | Current Source | New Owner | Status | Tests | Rationale |
| --- | --- | --- | --- | --- | --- |
| Search | MkDocs/material | search-engine | implemented | packages/search-engine/src/index.test.ts; apps/desktop-electron/e2e/source.spec.ts | Offline desktop search returns complete DTOs. |
| Tags | front matter | content-engine | planned | planned | Dedicated tags UI is not part of this P1 slice. |
| Timeline | blog dates | content-engine | planned | planned | Dedicated timeline UI is not part of this P1 slice. |
| Word counts | hooks/word_counts.py | content-engine | implemented | packages/content-engine/src/index.test.ts | Python-compatible CJK/Latin count. |
| Reading time | hooks/word_counts.py | content-engine | implemented | packages/content-engine/src/index.test.ts | 500-display-unit rule. |
| Dark mode | CSS | renderer | planned | planned | Current styling is fixed dark reader. |
| Code copy | JS | renderer | planned | planned | Code rendering exists; copy action is not implemented. |
| Syntax highlighting | MkDocs | renderer | planned | planned | Sanitized code blocks exist; highlighting is later. |
| Image lightbox | JS/CSS | renderer | planned | planned | Images can render; lightbox is later. |
| Mermaid | MkDocs | renderer | planned | planned | Rendered as safe text/fence only. |
| Footnotes | Markdown | renderer | planned | planned | Markdown-it default coverage only. |
| Internal links | Markdown | application/renderer | planned | planned | Partial resolver exists; E2E coverage is pending. |
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

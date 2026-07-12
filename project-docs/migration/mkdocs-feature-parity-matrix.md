---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-12
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
| Dark mode | CSS | renderer | implemented | apps/desktop-electron/src/renderer/preferences.test.ts; apps/desktop-electron/e2e/preferences.spec.ts | System, light, and dark themes persist with bounded article text scaling and theme-aware code, Mermaid, and footnotes. |
| Code copy | JS | renderer | implemented | apps/desktop-electron/src/renderer/copy-code.test.ts; apps/desktop-electron/e2e/source.spec.ts | Every fenced block receives a keyboard-accessible copy control, live feedback, Clipboard API handling, and a packaged-renderer fallback. |
| Syntax highlighting | MkDocs | renderer | implemented | apps/desktop-electron/src/renderer/syntax-highlight.test.ts; apps/desktop-electron/e2e/syntax-highlight.spec.ts | Registered local grammars highlight near the viewport without auto-detection, while unknown languages remain plain text. |
| Image lightbox | JS/CSS | renderer | implemented | apps/desktop-electron/e2e/source.spec.ts | Local article images are keyboard focusable, lazy-loaded, and open in an accessible modal with Escape and focus restoration. |
| Mermaid | MkDocs | renderer | implemented | apps/desktop-electron/src/renderer/mermaid-renderer.test.ts; apps/desktop-electron/e2e/mermaid.spec.ts | Fenced Mermaid diagrams load near the viewport with strict mode, a second SVG allowlist, accessible output, and a source fallback. |
| Footnotes | Markdown | renderer | implemented | packages/renderer-ui/src/index.test.ts; apps/desktop-electron/e2e/footnotes.spec.ts | Named, inline, multi-block, and repeated footnotes use deterministic accessible in-app navigation. |
| Internal links | Markdown | application/renderer | implemented | packages/content-engine/src/index.test.ts; apps/desktop-electron/e2e/source.spec.ts | Same-page and cross-article Unicode fragments remain inside the app shell. |
| Reader navigation history | browser navigation | renderer | implemented | apps/desktop-electron/src/renderer/navigation-history.test.ts; apps/desktop-electron/e2e/navigation-history.spec.ts | Semantic Back/Forward restores article, fragment, search, and facet state without changing the trusted renderer URL. |
| Git revision date | plugin | manifest | planned | planned | Not in current reader UI. |
| Blog ordering | MkDocs | content-engine | implemented | packages/content-engine/src/index.test.ts | Date sorting for formal articles. |
| Observatory | docs page | renderer | planned | planned | Not in P1 reader slice. |
| Article import | publish_article.py | content-engine/main/renderer | implemented | packages/content-engine/src/article-import/index.test.ts; packages/content-engine/src/article-import/commit.test.ts; apps/desktop-electron/e2e/import-wizard.spec.ts | Native selection, deterministic preview, metadata correction, atomic commit, rollback, navigation, and restart persistence are available offline. |
| Citation cleanup | tools | content-engine/import | implemented | packages/content-engine/src/article-import/index.test.ts; apps/desktop-electron/e2e/import-wizard.spec.ts | Cleanup is previewed before write and shared by file and folder imports. |
| Category inference | tools | content-engine | implemented | packages/content-engine/src/index.test.ts | Canonical path category. |
| Slug generation | tools | content-engine | implemented | packages/content-engine/src/index.test.ts | Canonical path slug. |
| Assets copying | tools | content-engine/import | implemented | packages/content-engine/src/article-import/commit.test.ts; apps/desktop-electron/e2e/import-wizard.spec.ts | Assets are fingerprinted, staged, validated, and atomically published. |
| Research appendix | tools | content-engine/import | implemented | packages/content-engine/src/article-import/index.test.ts; packages/content-engine/src/article-import/commit.test.ts | Optional research activity is cleaned and embedded in the canonical article. |
| Generated word-count index | hook | manifest | planned | planned | Manifest exists; page generation not replaced. |
| GitHub Pages deployment | workflow | deploy.yml | preserved | .github/workflows/deploy.yml | Web deployment remains separate. |

| Persistent desktop layout | fixed browser viewport | main/renderer | implemented | apps/desktop-electron/src/main/window-state.test.ts; apps/desktop-electron/e2e/resizable-layout.spec.ts | Accessible pane resizing/collapse and validated native window bounds survive restart. |

| Native commands and palette | browser shortcuts | main/preload/renderer | implemented | packages/platform-contracts/src/desktop-command.test.ts; apps/desktop-electron/e2e/command-palette.spec.ts | One typed allowlist drives menu, shortcuts, preload delivery, and the accessible command palette. |

| Local workspace selection | static site root | main/preload/application/content-engine | implemented | apps/desktop-electron/src/main/workspace-state.test.ts; apps/desktop-electron/e2e/local-workspace.spec.ts | Native folder selection, persisted recent workspace, diagnostics, bad-file isolation, and bundled fallback without renderer filesystem access. |

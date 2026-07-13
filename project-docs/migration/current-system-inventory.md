---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0008
  - ADR-0018
---

# Current System Inventory

Canonical content remains `docs/<category>/<slug>/index.md` with YAML front matter and local assets. MkDocs still owns the web presentation through `mkdocs.yml`, CSS, JavaScript, hooks, and the public Observatory/word-count pages. The desktop runtime does not wrap MkDocs: TypeScript Content Engine owns article parsing, category/tag/timeline data, revision dates, reading statistics, diagnostics, manifests, safe import cleanup/assets, and canonical metadata; Search Engine owns the serialized incremental index; Electron owns native workspace, import, diagnostics, telemetry, packaging, and release boundaries.

Desktop parity is complete for reading, search, category/tag/timeline browsing, revision dates, word counts, Observatory summaries, internal links, images, diagrams, syntax highlighting, footnotes, preferences, navigation history, local workspaces, and article import. GitHub Pages deployment remains a separate preserved adapter.

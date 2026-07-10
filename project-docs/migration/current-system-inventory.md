---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0008
---

# Current System Inventory

MkDocs owns web presentation through `mkdocs.yml`, `docs/stylesheets/extra.css` and `docs/javascripts/extra.js`. Python tools own legacy domain behavior: `hooks/word_counts.py` computes CJK/Latin reading counts, `tools/publish_article.py` imports articles from `_incoming/articles`, `tools/new_note.py` scaffolds notes, and `tools/remove_citations.py` removes citation/entity noise. Canonical data remains `docs/<category>/<slug>/index.md` with YAML front matter and `.meta.yml` navigation. Domain logic retained: article parsing, category inference, tags, word counts, reading time, import cleanup, asset copying and search. MkDocs-only adapters are retired for desktop runtime but kept for the web site.

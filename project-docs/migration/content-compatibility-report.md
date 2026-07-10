---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0002
---

# Content Compatibility Report

Corpus scan found Markdown front matter, headings, tables, fenced code, internal links, external links, raw HTML details, images, tags and CJK text. The desktop renderer supports headings, code blocks, links, images and plain Markdown fallback. Mermaid and MkDocs admonition syntax are handled as safe fenced/fallback content until native rendering is enabled by contract tests. Unsupported syntax is surfaced through diagnostics rather than silently dropped.

---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0001
---

# Desktop Product Spec

## Current P1 Vertical Slice

Research Observatory currently targets a real offline desktop reader slice: bundled `docs/` archive, formal article parsing, CJK/Latin reading statistics, full-text search, article list, sanitized Markdown reader, safe external links, Electron hardening, true Forge package/make commands, and Windows/Linux CI packaging smoke.

### User Story P1-Reader
Given the packaged app is installed without Python, MkDocs, or network access, when the user launches it, then the left article list loads from bundled resources, search can find an existing article by title/tag/body, and selecting an item displays title, date, tags, reading time, and sanitized Markdown.

### User Story P1-Security
Given untrusted Markdown content, when it is rendered or a link is clicked, then scripts are sanitized, Node is unavailable in the renderer, navigation is denied by default, and only `https:` or `mailto:` external URLs are delegated to the main process.

### User Story P1-Packaging
Given CI runs on Windows and Linux, when package-smoke executes, then Electron Forge creates native outputs and the smoke test launches the packaged executable before artifacts are uploaded.

## Requirement Status Policy
`implemented` means the behavior is present and mapped to a concrete test or runtime smoke. `planned` means the requirement remains in the product backlog and is not claimed complete in this PR.

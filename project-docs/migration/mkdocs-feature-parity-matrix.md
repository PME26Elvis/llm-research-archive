---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0008
---

# MkDocs Feature Parity Matrix

| Existing Feature | Current Source | New Owner | Preserve / Replace / Retire | Tests | Rationale |
| --- | --- | --- | --- | --- | --- |
| Search | MkDocs/material | search-engine | Replace | packages/search-engine/src/index.test.ts | Offline desktop search |
| Tags | front matter | content-engine | Preserve | packages/content-engine/src/index.test.ts | Data driven navigation |
| Timeline | blog dates | content-engine | Preserve | packages/application/src/index.test.ts | Deterministic order |
| Word counts | hooks/word_counts.py | content-engine | Preserve | packages/content-engine/src/index.test.ts | Parity with CJK rules |
| Reading time | hooks/word_counts.py | content-engine | Preserve | packages/content-engine/src/index.test.ts | Desktop metadata |
| Observatory | docs page | renderer | Replace | apps/desktop-electron/e2e/smoke.mjs | Data-driven graph |
| Article import | publish_article.py | application | Preserve | packages/application/src/index.test.ts | Workspace workflow |
| Citation cleanup | tools | content-engine | Preserve | packages/content-engine/src/index.test.ts | Clean corpus |
| GitHub Pages deployment | workflow | deploy.yml | Preserve separately | .github/workflows/deploy.yml | Web remains optional |

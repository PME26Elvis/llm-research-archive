---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-11
related-requirements:
  - FR-015
  - NFR-001
  - NFR-003
---

# ADR-0010: Bounded local syntax highlighting

## Context

The canonical Markdown corpus contains fenced code that should remain readable in an offline desktop reader. The renderer already preserves fenced-code source, adds a keyboard-accessible copy control, and treats Mermaid as a separate strict rendering pipeline. Syntax highlighting must not introduce a CDN, remote grammar downloads, automatic language guessing, executable markup, or a second copy-source representation.

Loading every grammar from a general-purpose highlighter would increase the renderer bundle and initialization cost. Performing synchronous highlighting for every code block during article selection would also make long research articles more likely to block the renderer.

## Decision

Use the pinned `highlight.js` 11.11.1 core package and register only a bounded local language set:

- Bash
- C
- C++
- CSS
- Diff
- JavaScript
- JSON
- Markdown
- Python
- SQL
- TypeScript
- XML/HTML
- YAML

Common fence aliases are normalized to those canonical names. The renderer does not call automatic language detection. Unknown and plaintext fences remain readable plain text.

Highlighting is mounted after Mermaid replacement and fenced-code toolbar decoration. An `IntersectionObserver` processes a block only when it approaches the viewport. Mermaid fences are explicitly excluded. Environments without `IntersectionObserver` use a deterministic immediate fallback.

The highlighter receives only `code.textContent`. Its generated markup is passed through a second repository-owned sanitizer that allows only `span` elements and their `class` attribute before assignment to `innerHTML`. The original copy behavior continues to read `code.textContent`, so token spans cannot alter the copied source.

Token colors are repository-owned CSS bundled with the renderer. No remote theme, font, grammar, worker, or network request is used.

## Alternatives considered

### Full highlight.js bundle with auto-detection

Rejected because it ships unnecessary grammars, adds non-deterministic detection work, and can spend more time on large or ambiguous code blocks.

### Shiki

Shiki offers high-fidelity TextMate grammars, but its grammar/theme/WASM lifecycle is heavier than the current reader needs. It remains an option if future requirements demand editor-grade highlighting or a much broader language catalog.

### Prism

Prism is viable, but grammar dependency ordering and alias management would still require a repository-owned registration layer. The selected highlight.js core API provides the required explicit registration with less custom integration.

### Repository-owned regular-expression highlighter

Rejected because language lexing edge cases would become a long-term security and correctness responsibility without providing product-specific value.

## Consequences

- Registered fences receive deterministic local highlighting near the viewport.
- Unknown languages degrade to plain text instead of incorrect guessed highlighting.
- The renderer bundle grows only by the selected core and grammars.
- Adding a language requires code review, an alias decision, tests, and bundle impact review.
- Copy, Mermaid, CSP, and offline behavior remain unchanged.

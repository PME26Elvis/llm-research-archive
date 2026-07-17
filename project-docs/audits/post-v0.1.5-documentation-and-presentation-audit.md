---
status: proposed
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0020
  - ADR-0021
---

# Post-v0.1.5 documentation and presentation audit

## 1. Purpose

This audit identifies documentation and presentation work that should follow the v0.1.5 Astro dual-renderer release. It separates verified drift from future implementation work so that the repository does not rewrite already-correct architecture records or mark unimplemented product surfaces as complete.

The audit has two goals:

1. make the repository's public story accurately explain that it preserves long-form reports produced by LLM research modes; and
2. prepare both retained desktop renderer entries to expose one neutral, source-backed explanation of the Deep Research product category.

## 2. Audit basis

The following facts were verified on `app-main` on 2026-07-17:

- `project-docs/migration/astro-frontend-refactor-spec.md` is `accepted`, includes an implementation outcome, and names Astro as default with Classic retained.
- `project-docs/architecture/adr/0020-incremental-astro-renderer-migration.md` is `accepted` and records the implemented dual-renderer decision.
- `project-docs/roadmap/desktop-roadmap.md` marks the Astro program complete and treats the two entries as implementations of one product.
- `README.md` correctly describes the two desktop entries, but only after a long MkDocs-oriented introduction.
- The opening README description presents the repository primarily as a general long-form knowledge base. It does not yet explain the narrower provenance story: many archived reports originate from vendor research agents or equivalent multi-step LLM research workflows.
- The desktop entries share content, search, import, localization, diagnostics, security, packaging, and release authority. Therefore explanatory prose must not be copied into two framework-owned versions.

## 3. Executive finding

The architecture documentation is substantially current. The main gap is not an obsolete Astro decision record; it is an incomplete product narrative and the absence of a first-class explanatory surface.

The repository currently answers **how the archive is built** better than it answers:

- What kind of AI output is being preserved?
- What does “Deep Research” mean across vendors?
- Why do vendor names differ?
- How is a research agent different from ordinary web search or a reasoning mode?
- What does preservation in this repository guarantee, and what does it not guarantee?

The next documentation pass should therefore prioritize product meaning, provenance, neutral terminology, and source methodology.

## 4. Documentation update matrix

### 4.1 Immediate public-positioning updates

| Target | Current condition | Required update | Priority |
| --- | --- | --- | --- |
| `README.md` opening | Leads with a broad MkDocs knowledge-base description | Add a concise repository identity statement explaining that the archive preserves long-form LLM research outputs, including Deep Research-class reports, while still containing other authored research material | P0 |
| `README.md` Desktop section | Correctly explains Astro and Classic entries | Add a short link to the canonical “What is Deep Research?” guide and state that both entries render the same source-backed content | P0 |
| `docs/index.md` | Public website landing page; exact copy must be reviewed during implementation | Add a neutral “What this archive preserves” section and a prominent link to the guide | P0 |
| Website navigation in `mkdocs.yml` | No known top-level conceptual guide | Add a stable “About / Deep Research” navigation item without placing it inside a vendor category | P0 |
| Release notes template | Describes implementation changes | Add a release-note convention for editorial-source updates when the guide changes, including research cutoff date | P1 |

### 4.2 Existing architecture and migration records

| Target | Verified status | Recommended treatment | Priority |
| --- | --- | --- | --- |
| `project-docs/migration/astro-frontend-refactor-spec.md` | Accepted and includes implementation outcome | Keep as historical implementation contract. Add only a cross-reference to the new guide UI spec when implemented; do not rewrite the migration narrative | P2 |
| `project-docs/architecture/adr/0020-incremental-astro-renderer-migration.md` | Accepted and contains implementation evidence | Keep unchanged except for an optional related-ADR link to ADR-0021 | P2 |
| `project-docs/roadmap/desktop-roadmap.md` | Astro program correctly marked complete | Add the Deep Research guide as proposed next-phase work until stable requirements and acceptance evidence exist | P0 |
| `project-docs/architecture/architecture.md` | Dual renderer documented by the v0.1.5 program | At implementation time, add the shared guide-content package and read-only rendering flow; avoid making project docs a runtime data source | P1 |

### 4.3 Product, quality, and governance documents

The following are implementation-time updates. They should not be marked implemented in this planning PR.

| Document area | Required change |
| --- | --- |
| Product requirements | Add stable requirements for global Help access, canonical content parity, offline availability, source visibility, timeline behavior, and first-run explanation |
| Acceptance evidence | Add evidence IDs for guide opening in Astro and Classic, source-link safety, content checksum parity, keyboard navigation, narrow-window behavior, and localization |
| Testing strategy | Define unit tests for guide schema, snapshot/semantic parity tests for both entries, Electron E2E journeys, and packaged smoke checks |
| Security model | Record that the guide is bundled and read-only; external sources open only through the existing safe navigation policy; no runtime vendor fetch is allowed |
| Localization | Translate interface labels and guide content through versioned canonical files; never let one renderer maintain an independent translation |
| Accessibility policy | Require heading order, landmark structure, table alternatives, timeline list fallback, reduced motion, keyboard operation, and screen-reader source descriptions |
| Dependency inventory | Add dependencies only if the final design cannot be implemented with existing primitives; a timeline library is not justified by default |
| Traceability registry | Map each new functional and non-functional requirement to shared schema tests, both renderer journeys, and package evidence |
| Release process | Treat source-register or canonical-guide changes as user-visible content changes and include the research cutoff in release notes |

## 5. Presentation audit

### 5.1 Missing product-level entry points

The desktop application needs a stable explanation entry that is not buried in preferences or diagnostics. Recommended access hierarchy:

1. **Primary:** a top-level `說明` / `Guide` action in each renderer header.
2. **Native:** a `Help > What is Deep Research?` command, available regardless of active renderer.
3. **Contextual:** a small link in the empty library state: `What does this archive preserve?`
4. **Onboarding:** a one-time dismissible introduction after first launch or after the feature ships.
5. **Article context:** an unobtrusive `About this archive` link near provenance metadata, not repeated inside every article body.

The full guide must remain reachable after onboarding is dismissed.

### 5.2 Surfaces that should not own the guide

The guide should not be placed exclusively in:

- Preferences, because the content explains the product rather than configures it;
- Observatory diagnostics, because it is user education rather than implementation telemetry;
- a modal-only About box, because the content is too long and requires navigation, comparison tables, sources, and a timeline;
- a remote website, because the desktop product promises offline operation;
- article content, because duplication would make editorial updates impossible to govern.

### 5.3 Brand and visual neutrality

- Use provider names as text labels, not marketing-colored cards that imply endorsement.
- Do not use vendor logos until licensing and asset provenance are explicitly reviewed.
- Use one neutral visual system for the comparison matrix.
- Order providers chronologically in the timeline and alphabetically or by official product name elsewhere; do not order by perceived quality.
- Label promotional statements as `供應商宣稱`.
- Do not display benchmark winners or scores unless the guide is expanded with independent methodology and date-bounded context.

## 6. Canonical content gap

A single framework-neutral dossier is required. It must explain:

- the umbrella meaning of Deep Research;
- the typical agent loop: scope, plan, retrieve, refine, analyze, synthesize, cite;
- the distinction between web search, reasoning/Think modes, and research agents;
- official names and launch histories for Gemini, ChatGPT, Grok, Claude, and DeepSeek-adjacent capabilities;
- which details are official product claims and which are repository-level synthesis;
- limitations of citations and generated reports;
- the archive's preservation promise and non-guarantees;
- source URLs, publication dates, access date, and claim scope.

The canonical dossier for this planning phase is:

- `project-docs/research/deep-research-field-guide.zh-Hant.md`
- `project-docs/research/deep-research-source-register.json`

These are editorial and design authorities, not the eventual runtime import path. ADR-0021 defines how implementation should convert them into one shared product-owned content package.

## 7. Recommended implementation sequence

### Phase A — documentation truth

- Update README and public landing-page positioning.
- Add the canonical source-backed guide to public documentation.
- Add the proposed roadmap item and ADR cross-references.
- Validate links and MkDocs strict build.

### Phase B — shared content contract

- Create a typed `packages/deep-research-guide/` package.
- Convert canonical prose, timeline entries, providers, and sources into validated immutable data.
- Add schema and editorial-lint tests.
- Generate a content digest consumed by both renderer tests.

### Phase C — Astro entry

- Add the static-first guide surface and minimal interactive controls.
- Connect top-level, native Help, empty-state, and onboarding entry points.
- Validate packaged `file:` behavior and CSP.

### Phase D — Classic entry

- Render the same shared package with Classic React/Vite components.
- Match semantic order and capabilities while respecting Classic layout conventions.
- Prove content digest parity.

### Phase E — evidence and release

- Run unit, accessibility, Electron E2E, and four-platform packaged smoke.
- Update product requirements, architecture, security, traceability, and acceptance evidence.
- Publish as a user-visible feature release with the guide research cutoff date.

## 8. Definition of done for the future implementation

The work is complete only when:

- both entries expose the guide through their header and the native Help menu;
- both render the same canonical provider facts, timeline, comparison, limitations, and source register;
- all content is available offline;
- all external links use the existing safe navigation boundary;
- the timeline remains understandable without animation, color, or horizontal scrolling;
- narrow windows and keyboard-only usage are tested;
- the guide identifies DeepSeek's naming asymmetry instead of falsely presenting a standalone Deep Research product;
- source records include an official URL, publication date when available, access date, and claim scope;
- README, website landing page, roadmap, architecture, security, testing, traceability, and release documentation are synchronized;
- no renderer-specific prose fork exists.

## 9. Explicit non-goals

This planning work does not:

- rank vendors;
- independently benchmark research quality;
- claim that an archived report is factually correct merely because it includes citations;
- expose raw hidden chain-of-thought;
- add live vendor APIs or web requests to the desktop application;
- turn the guide into an advertising carousel;
- retire the Classic entry;
- create a separate content store for Astro.

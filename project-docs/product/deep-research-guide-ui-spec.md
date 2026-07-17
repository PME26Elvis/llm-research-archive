---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0020
  - ADR-0021
research-cutoff: 2026-07-17
---

# Deep Research Guide product and UI specification

## 1. Purpose

Add a first-class, offline `說明 / Guide` experience to both retained renderer entries:

- Astro Observatory, the default static-first entry;
- Classic Observatory, the retained React/Vite entry.

Both entries must explain what Deep Research is, how vendor names differ, how the product category evolved, and what this archive does and does not guarantee. They may use framework-appropriate layouts, but they must render one canonical source-backed content model.

## 2. Principles

1. Explain the category before comparing vendors.
2. Maintain one editorial authority; no renderer-owned prose fork.
3. Do not rank providers or use marketing visual hierarchy.
4. Bundle all content locally; no runtime vendor fetch.
5. Keep sources, publication dates, access dates, and claim scope visible.
6. Opening the guide must preserve workspace, search, article, scroll, import, preference, and renderer state.
7. Require semantic parity, not pixel parity.
8. Make the timeline understandable as an ordered list without color, motion, or horizontal scrolling.

## 3. Information architecture

Both entries use the same stable section IDs:

| ID | Label | Purpose |
| --- | --- | --- |
| `guide.overview` | 快速理解 | Definition, naming map, category disclaimer |
| `guide.workflow` | 它怎麼運作 | Plan, retrieve, refine, analyze, synthesize, cite |
| `guide.distinctions` | 搜尋、思考與研究 | Search vs reasoning mode vs research agent |
| `guide.timeline` | 歷史時間線 | Dated milestones with product/model context |
| `guide.providers` | 各家怎麼稱呼 | Neutral provider dossiers |
| `guide.comparison` | 中立比較 | Comparable fields and explicit unknowns |
| `guide.archive` | 這個 repo 保存什麼 | Preservation purpose and non-guarantees |
| `guide.verify` | 如何查核一份報告 | Reader checklist |
| `guide.sources` | 來源與方法 | Source register, cutoff, editorial method |

## 4. Entry points

### Renderer header

- Wide layout: visible `說明` button with restrained book/help icon.
- Compact layout: icon button with accessible name and tooltip.
- It is top-level, not buried in Preferences or Observatory diagnostics.

### Native Help menu

Add localized commands:

- `What is Deep Research?`
- `About this archive`

Main emits a finite typed command with a known section ID. Unknown IDs fall back to `guide.overview`.

### Contextual access

- Welcome or empty state: `What does this archive preserve?`
- Article provenance: `About Deep Research reports`
- First launch after shipping: one dismissible, non-blocking introduction card.

Dismissal is stored with a guide-content version. The full guide remains permanently reachable.

## 5. Shared content package

Proposed implementation:

```text
packages/deep-research-guide/
├── content/zh-Hant/
│   ├── guide.json
│   └── prose/*.md
├── src/
│   ├── schema.ts
│   ├── providers.ts
│   ├── timeline.ts
│   ├── sources.ts
│   ├── load-guide.ts
│   └── digest.ts
└── tests/
    ├── schema.test.ts
    ├── sources.test.ts
    ├── neutrality.test.ts
    └── digest.test.ts
```

The planning documents under `project-docs/research/` are editorial source material. During implementation, content is promoted into this package and a readable Markdown snapshot is generated back into docs. Runtime code must not read arbitrary project documentation.

Canonical entities include:

- `GuideSectionId`
- `ProviderId`
- `TimelineEvent`
- `ProviderProfile`
- `SourceRecord`
- `GuideLocale`
- `GuideVersion`

Each timeline event contains date, provider, official product name, model context or explicit unknown, summary, attribution type, and source IDs.

### Content digest

Generate a deterministic digest over locale, version, prose, provider records, timeline, comparison fields, and source register. Both renderer DOMs expose the active digest for tests and diagnostics. CI rejects mismatched digests.

## 6. Astro Observatory design

Astro uses a **dedicated Guide workspace** in its modern static shell.

Wide layout:

1. Guide rail with sections and reading progress.
2. Central guide canvas with prose, timeline, provider profiles, and comparison.
3. Evidence inspector with selected source metadata and official-link action.

Compact layout collapses source details below the selected item. Narrow layout becomes one vertical document with a sticky section selector.

Proposed components:

```text
apps/desktop-astro/src/components/guide/
├── DeepResearchGuide.astro
├── GuideRail.astro
├── GuideOverview.astro
├── ResearchWorkflow.astro
├── ResearchTimeline.astro
├── ProviderProfiles.astro
├── ProviderComparison.astro
├── ArchiveMeaning.astro
├── VerificationChecklist.astro
└── SourceInspector.astro
```

Astro renders prose, headings, provider data, timeline fallback, and source metadata as static HTML. A small framework-free controller or narrowly hydrated island may own current section, provider filter, selected source, open/close, and focus restoration. It must not duplicate the application-wide React state or hydrate the entire guide.

The workspace island remains mounted while the Guide surface is active, preventing search and reader state loss. A separate local HTML route is acceptable only after four-platform `file:` and return-navigation evidence.

## 7. Classic React/Vite design

Classic uses a **full-height Help Center overlay** above the mature three-pane workspace. This avoids a router migration and preserves current state.

Wide layout:

- compact section navigation on the left;
- scrollable guide document in the center;
- optional source details on the right.

Narrow layout:

- full-screen accessible dialog;
- section selector at top;
- source details expand inline;
- persistent close action.

Proposed components:

```text
apps/desktop-electron/src/renderer/guide/
├── DeepResearchGuideDialog.tsx
├── GuideNavigation.tsx
├── GuideSection.tsx
├── ResearchTimeline.tsx
├── ProviderComparison.tsx
├── ProviderDisclosure.tsx
├── SourceDetails.tsx
└── useGuideController.ts
```

Classic uses dense document-oriented controls. Provider profiles use disclosure sections; the timeline resembles a readable audit log; comparison is a grid on wide screens and labeled definition lists on narrow screens.

Use native `<dialog>` only if packaged Electron accessibility tests pass. Otherwise use the repository's accessible overlay primitive. Background workspace becomes inert, Escape closes, and focus returns to the invoker.

## 8. Functional requirements

- **DRG-FR-001 Global access:** header and native Help open a known guide section in both entries.
- **DRG-FR-002 Canonical parity:** both entries render the same version and digest.
- **DRG-FR-003 Offline operation:** prose, data, timeline, and source metadata are packaged locally.
- **DRG-FR-004 Safe links:** official sources open externally through existing HTTPS navigation policy.
- **DRG-FR-005 State preservation:** open/close does not reset workspace state.
- **DRG-FR-006 Deep links:** onboarding and contextual links target stable section IDs.
- **DRG-FR-007 Timeline:** all events remain chronologically readable; provider filtering is optional.
- **DRG-FR-008 Comparison:** official name, launch date, model context, source scope, planning behavior, and output form are comparable; unknown remains explicit.
- **DRG-FR-009 Methodology:** cutoff and attribution rules are visible.
- **DRG-FR-010 Onboarding:** first-run explanation is dismissible and non-blocking.
- **DRG-FR-011 Localization:** chrome and body use locale-owned canonical resources.
- **DRG-FR-012 Update visibility:** material guide updates increment version and may show a one-time update indicator.

## 9. Non-functional requirements

### Neutrality

Editorial validation rejects unsupported superlatives, provider rankings, winner fields, and use of `Deep Research` as DeepSeek's official product name unless a future official source proves it.

### Accessibility

- logical headings and landmarks;
- ordered-list timeline fallback;
- non-table narrow comparison;
- keyboard and screen-reader labels;
- focus restoration;
- reduced-motion behavior;
- tested at 800 × 600 and narrow layouts.

### Security

- no runtime guide network request;
- no remote image, font, script, iframe, or embed;
- repository-owned Markdown rendering and sanitization;
- schema accepts only HTTPS official links;
- external links pass through current Electron safe-navigation policy.

### Performance

- no violation of existing per-renderer initial-JavaScript budgets;
- Astro does not hydrate static guide prose;
- Classic may lazy-load guide UI after first invocation;
- opening the guide does not reparse the full article corpus.

### Maintainability

A provider, event, source, or prose section is edited once. Renderer directories may contain UI labels and fixtures, not vendor-history prose.

## 10. Validation

Add `scripts/validate-deep-research-guide.mjs` to reject:

- duplicate IDs;
- source references that do not exist;
- timeline events without official evidence;
- dates after the research cutoff;
- non-HTTPS source URLs;
- vendor claims without attribution;
- ranking fields;
- missing locale sections;
- renderer-owned copies of canonical vendor prose.

## 11. Test plan

### Shared package

Schema validation, chronological ordering, source integrity, exact provider-name policy, neutrality lint, cutoff validation, locale completeness, and deterministic digest.

### Astro

Static production HTML, guide controller, provider filter, focus restoration, reduced motion, narrow layout, CSP/`file:` validation, and zero guide network requests.

### Classic

On-demand loading, focus trap, Escape/close, workspace preservation, narrow alternatives, safe external link handling, and no prose fork.

### Electron E2E

1. Astro header opens guide; timeline/source works; close restores article/query state.
2. Native Help opens requested section.
3. Contextual archive link restores reader scroll after close.
4. Classic opens the same digest and source count.
5. Restart with Classic selected and invoke native Help.
6. Disallowed URL fixture never reaches `shell.openExternal`.
7. Keyboard-only and narrow-window journey.
8. Locale persistence and complete-body fallback behavior.

### Four-platform packaged smoke

Windows x64, Linux x64, macOS arm64, and macOS x64 must open the guide in both entries, verify digest, close back to workspace, find bundled source metadata, and make no guide network request.

## 12. Rollout

1. **Planning PR:** audit, field guide, source register, ADR, UI spec.
2. **Shared-content PR:** package, schema, digest, validators, generated documentation snapshot.
3. **Astro implementation PR:** Guide workspace and all entry points, initially feature-gated.
4. **Classic implementation PR:** Help Center overlay and digest parity; remove feature gate only when both entries pass.
5. **Synchronization/release PR:** README, website navigation, roadmap, product requirements, architecture, security, testing, traceability, acceptance evidence, release notes, full CI and four-platform prerelease.

## 13. Acceptance criteria

- `說明` is visible and usable in Astro and Classic.
- Native Help opens the active renderer's guide.
- The guide covers definition, workflow, distinctions, timeline, providers, comparison, archive meaning, verification, and sources.
- Official names are accurate and DeepSeek is not falsely branded.
- Both entries report the same content digest and record counts.
- The guide works fully offline.
- External links use safe navigation.
- Workspace and reader state survive open/close.
- Keyboard, reduced motion, screen-reader semantics, 800 × 600, and narrow layouts pass.
- README and public website explain what the archive preserves.
- Every requirement maps to automated or reviewable evidence.

## 14. Prototype decisions still required

- Astro shell-owned surface versus second local HTML route.
- Native `<dialog>` viability in packaged Classic.
- Evidence inspector collapse breakpoint.
- Complete English body in first release versus Traditional Chinese body with bilingual chrome.
- Committed versus CI-generated public guide snapshot.
- Optional F1 shortcut after cross-platform conflict review.

None of these decisions may change the one-content-authority rule.


## 15. Implementation outcome

The specification is implemented with the following resolved prototype decisions:

- Astro uses a shell-owned static-first Guide surface; no second local route or server is introduced.
- Classic uses the repository-owned accessible overlay primitive rather than native `<dialog>`.
- The evidence inspector remains a third column at wide widths and collapses inline below 1040 px.
- Version 1.0.0 ships complete Traditional Chinese and English bodies, not bilingual chrome over one untranslated body.
- The public Markdown guide is committed and validated against the shared package/source register rather than generated only inside CI.
- `Ctrl+Shift+G` is the cross-platform Guide shortcut; F1 remains unassigned.

Implementation evidence is owned by `packages/deep-research-guide`, `apps/desktop-astro/src/components/guide`, `apps/desktop-electron/src/renderer/guide`, `apps/desktop-electron/e2e/deep-research-guide.spec.ts`, `scripts/validate-deep-research-guide.mjs`, and `scripts/packaged-smoke.mjs`.

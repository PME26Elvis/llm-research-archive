---
status: proposed
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0001
  - ADR-0004
  - ADR-0008
  - ADR-0016
  - ADR-0018
  - ADR-0020
---

# Astro Frontend Refactor Specification

## 1. Purpose

This specification defines an incremental replacement of the Research Observatory desktop renderer with an Astro-based frontend while preserving the existing Electron main process, preload boundary, platform contracts, canonical Markdown corpus, offline operation, packaging matrix, and release guarantees.

The refactor is not a visual reskin and is not permission to discard current behavior. It uses Astro's static-first rendering, component composition, framework integrations, and islands architecture to reorganize the renderer into a modern information architecture with substantially less always-hydrated JavaScript.

The work is considered complete only after the Astro renderer reaches verified behavioral parity, meets the security and performance gates in this document, ships through the existing four-platform release pipeline, and retains a tested rollback path.

## 2. Product outcome

The finished application should feel like a purpose-built research workspace rather than a web page placed inside an Electron window.

The primary experience has five coordinated surfaces:

1. **Global command bar** — search, command palette, workspace state, language, theme, and high-frequency actions.
2. **Library rail** — compact category, tag, date, and saved-view navigation.
3. **Result pane** — filterable article cards or dense rows with clear metadata and keyboard selection.
4. **Reading canvas** — distraction-controlled article layout, sticky local table of contents, figures, code, Mermaid, notes, and source metadata.
5. **Context inspector** — article diagnostics, revisions, word count, import status, workspace information, and Observatory details without replacing the reader.

The layout must adapt from a three-pane desktop workspace to a two-pane compact mode and a single-canvas narrow mode. The application minimum window remains usable at 800 x 600. No critical action may depend on hover.

## 3. Non-goals

The refactor does not:

- replace Electron with a browser-only product;
- add a server, SSR adapter, cloud database, remote content API, or account system;
- turn local workspaces into Astro build-time content;
- translate article bodies;
- change canonical article paths or front matter merely to satisfy Astro;
- weaken typed IPC, context isolation, sandboxing, CSP, sanitizer, or navigation restrictions;
- introduce a remote CDN, analytics beacon, telemetry upload, or runtime font download;
- redesign import transaction semantics, search ownership, release versioning, or signing policy;
- remove the current renderer before the Astro renderer passes the cutover and rollback gates.

## 4. Framework basis

The implementation is based on these Astro capabilities and constraints:

- Astro renders static HTML by default and hydrates only explicitly selected interactive components through `client:*` directives.
- UI framework integrations allow existing React components to be embedded as Astro islands during migration.
- Astro components are appropriate for static shell, layout, metadata, and presentational composition.
- Content Collections provide schema validation and typed build-time content access, but they do not replace the runtime Content Engine for user-selected local workspaces.
- A static Electron renderer must produce deterministic local assets with no server dependency.

Primary references:

- https://docs.astro.build/en/concepts/islands/
- https://docs.astro.build/en/guides/integrations-guide/react/
- https://docs.astro.build/en/guides/content-collections/
- https://docs.astro.build/en/reference/configuration-reference/

## 5. Architectural decision

### 5.1 Stable boundaries

The following remain authoritative and are not moved into Astro:

- Electron main process;
- preload bridge;
- filesystem and workspace selection;
- import planning and commit transactions;
- search-index lifecycle;
- native menu and native dialogs;
- startup telemetry and local diagnostics;
- release and packaging authority;
- shared DTO schemas and platform contracts;
- Content Engine, Search Engine, Application, and Domain packages.

Astro is a renderer adapter. It consumes validated DTOs and emits typed commands through the existing preload API.

### 5.2 Side-by-side migration application

Create a new application at `apps/desktop-astro/`. Do not rewrite `apps/desktop-electron/src/renderer/` in place during the migration.

The existing Electron main and preload code remain under `apps/desktop-electron/`. Forge receives a selectable renderer output:

- legacy output: current Vite React renderer;
- candidate output: Astro static build;
- production output: selected by an explicit repository configuration after cutover approval.

This side-by-side structure keeps PRs reviewable, allows A/B launch in CI, and preserves a branch-independent rollback artifact.

### 5.3 Proposed repository structure

```text
apps/
├── desktop-electron/
│   └── src/
│       ├── main/                    # unchanged authority
│       ├── preload/                 # unchanged authority
│       └── renderer/                # legacy renderer until retirement
└── desktop-astro/
    ├── astro.config.mjs
    ├── package.json
    ├── public/
    └── src/
        ├── pages/
        │   └── index.astro
        ├── layouts/
        │   └── ObservatoryLayout.astro
        ├── components/
        │   ├── shell/
        │   ├── library/
        │   ├── reader/
        │   ├── inspector/
        │   └── primitives/
        ├── islands/
        │   ├── AppController.tsx
        │   ├── CommandPalette.tsx
        │   ├── SearchWorkspace.tsx
        │   ├── ReaderInteractions.tsx
        │   ├── Preferences.tsx
        │   ├── ImportWizard.tsx
        │   └── ObservatoryInspector.tsx
        ├── state/
        ├── styles/
        │   ├── tokens.css
        │   ├── base.css
        │   ├── layout.css
        │   └── utilities.css
        └── env.d.ts
packages/
├── renderer-ui/                     # framework-neutral rendering helpers
├── ui-system/                       # tokens and primitive contracts, added when needed
├── platform-contracts/
├── application/
├── content-engine/
├── search-engine/
└── domain/
```

A new shared package is justified only when at least two renderer adapters consume it. Astro-only presentational code stays in `apps/desktop-astro`.

## 6. Rendering model

### 6.1 Static Astro shell

The initial HTML should include the stable application frame, landmark structure, loading skeleton, modal portals, focus targets, and non-interactive product chrome. Astro components own:

- page and landmark structure;
- global command bar presentation;
- pane containers;
- empty and loading states;
- static icons and local assets;
- design tokens and responsive layout;
- accessible skip links;
- no-JavaScript failure explanation.

### 6.2 Hydrated islands

Hydration is granted by behavior, not by visual component size.

| Island | Initial directive | Responsibility |
| --- | --- | --- |
| App controller | `client:load` | preload connection, first workspace load, top-level command routing, fatal-state recovery |
| Search workspace | `client:load` | query, browse mode, facets, result selection, keyboard navigation |
| Reader interactions | `client:visible` after article mount, or controller-owned hydration if required | link routing, footnotes, code copy, syntax highlighting, Mermaid, image lightbox |
| Command palette | controller-owned lazy mount | command discovery and execution |
| Preferences | controller-owned lazy mount | theme, text scale, locale, density, persisted layout |
| Import wizard | controller-owned lazy mount | source selection, preview, conflict resolution, commit |
| Observatory inspector | `client:idle` or user-triggered | diagnostics, revisions, statistics, startup evidence |

The implementation must not hydrate every Astro component merely because React is available. Each island requires a short justification in code review.

### 6.3 React migration strategy

Install the official Astro React integration and reuse current React components where that reduces migration risk. The sequence is:

1. Run the existing renderer as one React island inside the Astro shell.
2. Extract stable presentational shell and layout into Astro components.
3. Split interaction domains into independently hydrated islands.
4. Move framework-neutral logic into existing shared packages.
5. Retain React for complex stateful interactions where conversion has no measurable benefit.

Astro adoption does not require eliminating React. The objective is selective hydration and cleaner composition, not a framework purity exercise.

### 6.4 State ownership

There must be one authoritative client state graph for workspace, article selection, navigation history, query, locale, theme, and layout.

Cross-island communication must use a typed repository-owned store or typed DOM events. Ad-hoc globals, duplicated stores, implicit localStorage synchronization, and direct island-to-island imports that create circular ownership are prohibited.

Persisted preference schemas remain versioned. Migration from existing user data is mandatory and tested.

## 7. Content and Markdown strategy

### 7.1 Canonical runtime content

The runtime source of truth remains the current Content Engine exposed through typed preload IPC. Astro must not scan a user-selected workspace at build time.

Article DTOs continue to provide canonical Markdown, metadata, assets, diagnostics, and article identity. The renderer continues to:

- rewrite only validated local asset URLs;
- sanitize rendered HTML;
- assign deterministic heading IDs;
- preserve footnote behavior;
- render code and Mermaid locally;
- handle internal article links without browser navigation;
- reject unsupported external protocols.

### 7.2 Content Collections

Content Collections may be introduced for one or both of these bounded purposes:

1. build-time validation and typed metadata for the bundled archive;
2. developer documentation or static product pages that are not runtime workspaces.

They are not permitted to become a second canonical article parser. Any collection schema must be derived from, or explicitly mapped to, the repository's existing content contracts.

### 7.3 Mermaid requirement

The Astro renderer must consume the same strict Mermaid adapter or a shared successor. It must preserve:

- exact pinned dependency;
- local dynamic import;
- pre-parse and normalized source;
- strict security configuration;
- repository SVG sanitizer;
- lazy render near the viewport;
- source fallback on failure;
- theme rerender;
- accessible image naming;
- real bundled-corpus E2E coverage.

## 8. Local static-build and Electron integration

### 8.1 Output mode

Astro must build a static renderer. SSR, hybrid server output, middleware requiring a server runtime, and server-only actions are prohibited.

### 8.2 File URL compatibility spike

Before feature migration begins, Phase 0 must prove that the production Astro output loads through the same packaged Electron trust boundary on Windows, Linux, macOS arm64, and macOS x64.

The spike must verify:

- `index.html` opens through the packaged local renderer path;
- every script, stylesheet, image, and font resolves without HTTP;
- no generated asset URL begins at an unintended web origin;
- dynamic island chunks load from the packaged application;
- refresh and window recreation do not require route fallback;
- CSP remains restrictive;
- preload is available only in the trusted top-level frame;
- source maps and developer-only assets are excluded from release packages.

The exact Astro `base`, `site`, output path, and post-build rewriting strategy is intentionally selected by evidence from this spike. A CI script must reject absolute or remote production asset URLs.

### 8.3 Forge integration

Forge remains the packager. The Astro build is an explicit prerequisite of package and make commands. Release asset naming, checksums, SBOM, manifest, version injection, and footprint validation remain unchanged unless separately approved.

## 9. Design system and UI specification

### 9.1 Design principles

- **Research-first density** — compact enough for scanning, calm enough for long reading.
- **Progressive disclosure** — advanced diagnostics and import details appear when requested.
- **Stable spatial model** — navigation, results, reader, and inspector do not unexpectedly exchange positions.
- **Keyboard equivalence** — every pointer action has a discoverable keyboard path.
- **Local confidence** — workspace kind, offline state, import effects, and errors are explicit.
- **Content sovereignty** — article typography does not inherit cramped application chrome styles.

### 9.2 Tokens

Use repository-owned CSS custom properties for:

- semantic foreground/background/surface/border states;
- accent, success, warning, and danger states;
- spacing scale;
- radius scale;
- elevation scale;
- typography families, sizes, line heights, and readable measure;
- pane widths and density modes;
- motion duration/easing with reduced-motion overrides;
- focus ring and selection states.

Components consume semantic tokens, not raw color literals. Light and dark themes must pass the existing contrast policy.

### 9.3 Desktop layout

Default wide layout:

```text
┌──────────────────────────────── Global command bar ────────────────────────────────┐
│ Library rail │ Results / facets │ Reading canvas                      │ Inspector │
│              │                  │ local TOC, article, figures, notes  │           │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Rules:

- panes are resizable with keyboard-accessible separators;
- widths persist through the current versioned preference model;
- each pane has a minimum and maximum bound;
- the reader owns remaining width and a readable maximum measure;
- inspector opens as a pane on wide screens and a dialog/drawer on compact screens;
- command palette and import wizard are modal layers with focus trapping and restoration.

### 9.4 Library and results

Library navigation supports all current browse modes and facets. Results offer a compact row and comfortable card density without duplicating data retrieval. Selection state must be visible independently of color.

Result metadata prioritizes title, date, category/tags, reading time, and match context. Diagnostics and technical IDs remain secondary.

### 9.5 Reader

The reading canvas must support:

- readable line length and adjustable text scale;
- sticky title/metadata behavior that does not cover anchors;
- optional local table of contents generated from canonical heading IDs;
- clear tables with horizontal containment;
- code copy, language labels, and local syntax highlighting;
- secure Mermaid with source disclosure;
- image zoom with captions and keyboard operation;
- accessible footnotes and return links;
- internal article-link navigation with back/forward history;
- print-friendly content styles where Electron supports printing;
- preserved article text without automatic translation.

### 9.6 Motion

Motion is reserved for pane transitions, modal entry, selection feedback, and progressive disclosure. It must not delay content readiness. `prefers-reduced-motion` removes nonessential animation and smooth scrolling.

## 10. Accessibility

The Astro renderer must preserve or exceed the existing WCAG policy.

Required evidence includes:

- valid landmarks and one primary `main` region;
- skip navigation;
- visible focus in every theme;
- complete keyboard operation at 200% zoom;
- screen-reader names for panes, controls, diagrams, images, and status messages;
- live regions that do not repeatedly announce background state;
- focus trap and restoration for every modal;
- accessible resizable separators;
- no keyboard traps in code, tables, Mermaid, or drawers;
- reduced-motion behavior;
- high-contrast-safe selection and error states;
- locale-aware document language and native menus.

Static Astro markup is not assumed accessible merely because it is server-rendered. Real Electron E2E remains required.

## 11. Security model

The current Electron boundary is retained:

- `contextIsolation: true`;
- `sandbox: true`;
- `nodeIntegration: false`;
- denied permission requests;
- validated top-level IPC sender;
- deny-by-default window opening and navigation;
- no runtime network requirement;
- restricted `app-asset` protocol;
- typed preload surface;
- sanitized Markdown and Mermaid output;
- production DevTools policy unchanged.

Additional Astro-specific controls:

- production build contains no development toolbar;
- no remote integration scripts or framework telemetry;
- no inline executable content unless the CSP and build pipeline explicitly allow a hashed repository-owned bootstrap;
- generated HTML and chunks are scanned for remote URLs and unsafe protocols;
- integrations require dependency-policy review;
- framework adapters may not access Node APIs from the renderer;
- Astro environment variables expose no secrets to client code.

## 12. Performance budgets

The Astro migration must improve or preserve the current user-perceived performance.

Hard gates at cutover:

- initial renderer JavaScript remains below the existing 2 MiB gzip ceiling;
- the candidate must not exceed the legacy initial JavaScript by more than 10% without an approved exception and measured startup benefit;
- noninteractive shell HTML and CSS render before archive data completes;
- Mermaid and syntax-highlight runtimes remain outside the initial critical path;
- Observatory, import, and settings code load only when needed or during idle time;
- a 10,000-article workspace remains within the existing search and renderer-block budgets;
- no long task above 100 ms during ordinary result filtering on the CI benchmark fixture;
- package roots remain below 2 GiB;
- all startup telemetry milestones remain available for legacy/candidate comparison.

Performance comparisons use the same fixture, platform, build mode, and commit. A single favorable run is not sufficient; record median and worst observed values across the repository-defined sample count.

## 13. Migration phases

### Phase 0 — integration spike

Deliverables:

- minimal `apps/desktop-astro` static shell;
- Electron/Forge candidate renderer switch;
- local chunk and asset validation;
- CSP and preload proof;
- packaged smoke on all four platforms;
- written spike result and final asset-path decision.

Exit gate: a packaged Astro window launches offline on every platform without weakening security.

### Phase 1 — design foundation

Deliverables:

- design tokens;
- semantic shell and responsive pane grid;
- primitives for buttons, fields, tabs, dialogs, status, separators, cards, and empty states;
- light/dark and reduced-motion support;
- visual regression baseline for key viewport sizes.

Exit gate: static shell passes accessibility and theme checks with no product behavior removed.

### Phase 2 — parity bridge

Deliverables:

- current React renderer mounted as a single Astro island;
- existing preload API connected through an adapter;
- current E2E suite runnable against legacy and Astro-hosted modes;
- startup and footprint comparison report.

Exit gate: all current user journeys pass in Astro-hosted mode.

### Phase 3 — island decomposition

Deliverables:

- search/results island;
- reader-interaction island;
- command palette, preferences, import, and Observatory lazy islands;
- typed shared state/event contract;
- removal of duplicated top-level hydration.

Exit gate: no island hydrates solely for presentation; state ownership is documented and tested.

### Phase 4 — modern workspace UX

Deliverables:

- new library rail, results pane, reader canvas, and inspector;
- responsive compact modes;
- local table of contents;
- improved metadata and diagnostics presentation;
- persisted layout migration;
- full bilingual application chrome.

Exit gate: accepted design journeys, keyboard journeys, and 200% zoom journeys pass.

### Phase 5 — cutover candidate

Deliverables:

- complete requirements traceability update;
- legacy/candidate test matrix;
- corpus compatibility report;
- security review;
- performance and package-footprint report;
- four-platform prerelease;
- rollback instructions.

Exit gate: all current FR/NFR evidence points to passing Astro-compatible tests and a prerelease has been manually exercised.

### Phase 6 — production cutover and retirement

Deliverables:

- Astro selected as default renderer;
- legacy renderer retained for at least one published prerelease cycle and one rollback window;
- stable release after acceptance;
- legacy removal only in a separate PR after rollback evidence is no longer needed.

Exit gate: stable release verified with no unresolved parity defect. Branches are retained according to repository policy.

## 14. Branch and PR strategy

The specification is merged into `app-main` first. Implementation proceeds through normal merge commits with focused branches:

```text
agent/astro-phase-0-integration-spike
agent/astro-phase-1-design-foundation
agent/astro-phase-2-parity-bridge
agent/astro-phase-3-island-decomposition
agent/astro-phase-4-workspace-ux
agent/astro-phase-5-cutover-candidate
agent/astro-phase-6-production-cutover
```

A phase may use smaller PRs when its diff becomes difficult to review. Every PR targets `app-main`, uses normal merge, keeps its branch, and updates the phase checklist and evidence. No implementation phase is bundled into the Mermaid repair release solely to accelerate the roadmap.

## 15. Test strategy

### 15.1 Unit and contract

- Astro configuration and output-path validation;
- shared state transitions;
- route/article-link resolution;
- preference migration;
- DTO validation and preload adapter;
- Markdown, footnote, syntax, Mermaid, and sanitizer behavior;
- bilingual dictionaries and interpolation;
- component behavior that does not require Electron.

### 15.2 Static output validation

A repository script inspects the production Astro output for:

- remote scripts, styles, images, fonts, and source maps;
- absolute web-root asset paths that fail under packaged local loading;
- missing chunks and assets;
- development toolbar artifacts;
- unexpected inline scripts;
- duplicate client runtimes;
- chunk and gzip budgets.

### 15.3 Electron E2E

Every existing Electron journey must run against the candidate renderer. New journeys cover:

- first launch and shell readiness;
- workspace selection and persistence;
- search, facets, result keyboard navigation, and history;
- internal links and fragments;
- all bundled Mermaid fences;
- image, code, syntax, tables, and footnotes;
- import preview, conflict, commit, and recovery;
- theme, language, density, text scale, and pane persistence;
- command palette and native command routing;
- Observatory and diagnostics;
- compact layouts and 200% zoom;
- restart persistence;
- offline enforcement and blocked navigation.

### 15.4 Packaged evidence

Windows x64, Linux x64, macOS arm64, and macOS x64 each run:

- build;
- make;
- packaged launch smoke;
- preload/version/content check;
- local Astro chunk check;
- package footprint;
- release asset validation.

## 16. Acceptance criteria

The Astro frontend may become default only when all statements are true:

1. Every currently implemented FR/NFR remains implemented and traceable.
2. No current Electron E2E journey is skipped, weakened, or replaced by a mock-only test.
3. All bundled Markdown articles open without fatal rendering errors.
4. Every bundled Mermaid fence renders or is explicitly catalogued as invalid source with an approved content fix.
5. Runtime local workspaces require no Astro rebuild.
6. The app launches and remains useful with network access disabled.
7. Typed IPC, CSP, sender validation, sandboxing, and navigation restrictions remain intact.
8. Traditional Chinese and English application UI remain complete, immediate, persistent, and reflected in native menus/dialogs.
9. The static-output and renderer-footprint gates pass.
10. Search and startup performance remain inside repository budgets.
11. Accessibility automation and real keyboard/zoom journeys pass.
12. All four packaged targets launch from release-equivalent artifacts.
13. A published prerelease has a verified manifest, checksums, SBOM, and rollback instructions.
14. The legacy renderer can be selected without reverting unrelated commits during the rollback window.
15. Product Spec, requirement catalog, Acceptance Matrix, ADRs, testing strategy, security model, release process, and roadmap are synchronized.

## 17. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Astro emits paths unsuitable for packaged `file:` loading | Phase 0 multi-platform spike plus static-output URL validator before feature migration |
| React islands recreate a fully hydrated SPA | hydration budget, per-island justification, bundle report, and decomposition exit gate |
| duplicated state across islands | single typed state authority and contract tests |
| Content Collections duplicate Content Engine behavior | prohibit runtime workspace ownership and map any schema to existing contracts |
| visual redesign hides mature behavior | parity matrix and legacy/candidate E2E on the same PR head |
| framework integration expands dependency attack surface | exact pins, dependency inventory, production audit, no remote runtime assets |
| accessibility regresses under custom panes/drawers | accessible primitives, real Electron keyboard tests, 200% zoom, reduced motion |
| release packages grow | renderer and installed footprint gates on all targets |
| migration blocks routine fixes | side-by-side app, focused phases, normal merge, legacy selectable until retirement |
| renderer cutover is hard to reverse | explicit build selector, retained legacy output, documented rollback release procedure |

## 18. Rollback

Before cutover, rollback means selecting the legacy renderer in Forge and rebuilding the same source commit. After cutover, at least one release-capable tag or branch must retain the verified legacy selection.

A rollback release must:

1. identify the failed Astro version and affected platforms;
2. select the verified legacy renderer without reverting domain/content/import changes;
3. run the complete quality and four-platform package matrix;
4. publish with explicit rollback notes;
5. preserve user preference and workspace schemas;
6. open a follow-up issue/PR with captured diagnostics and a re-entry gate.

## 19. Documentation deliverables by phase

Each phase updates, as applicable:

- this specification;
- ADR-0020 and any new focused ADR;
- architecture overview;
- Product Spec and requirement catalog;
- Acceptance Matrix and requirements YAML;
- testing strategy and security model;
- performance budgets;
- dependency inventory;
- release process and artifact manifest;
- desktop roadmap;
- migration parity report;
- user-facing Desktop documentation.

## 20. Definition of done for this proposal

This proposal itself is complete when it is merged with ADR-0020, linked from the architecture and roadmap documents, and kept in `proposed` status. It authorizes design and implementation planning but does not mark Astro behavior as implemented, planned FR/NFR scope, or release-ready functionality.

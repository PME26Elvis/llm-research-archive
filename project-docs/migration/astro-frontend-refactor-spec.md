---
status: accepted
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

## Implementation outcome

The migration is implemented as two retained entries in one Electron product. Astro is the default and Classic React/Vite remains packaged and user-selectable. This avoids a misleading split into separate products or platforms while still preserving two independently built frontend technology stacks. Both entries share all backend authority and user data.

The implemented repository structure follows the side-by-side design in this document. Astro owns static HTML, CSP generation, local asset layout, and the modern workspace presentation. Shared interaction domains remain React islands so behavior is not duplicated or regressed; future decomposition may reduce hydration further without changing the product contract. A typed main/preload command switches entries, an atomic local state file persists the choice, and load failure returns to the previous renderer.

Verification is executable through `scripts/astro-output.test.ts`, `scripts/validate-astro-output.mjs`, `apps/desktop-electron/e2e/renderer-implementations.spec.ts`, the existing Electron parity suite, per-entry footprint checks, and four-platform packaged smoke.

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

### 5.2 Retained dual-entry application

`apps/desktop-astro/` and the Classic renderer are both production entries in the same Electron application. This is not a split into separate products, data stores, or platform editions.

The existing Electron main and preload code remain under `apps/desktop-electron/`. Forge packages two independently built renderer outputs:

- **Astro** — default entry at `.vite/renderer/astro_window/index.html`;
- **Classic React/Vite** — retained entry at `.vite/renderer/main_window/index.html`.

Electron main owns the active implementation. A versioned atomic state file in `userData` persists `astro` or `classic`, the native View menu and in-renderer control can switch entries, and `OBSERVATORY_RENDERER` provides a bounded diagnostic override. A failed load restores the previously working implementation.

This structure preserves meaningful technology-stack comparison and an immediate rollback path while avoiding duplicated backend behavior or independent release lines.

### 5.3 Implemented repository structure

```text
apps/
├── desktop-electron/
│   └── src/
│       ├── main/
│       │   └── renderer-state.ts         # persisted entry selection and recovery
│       ├── preload/                      # shared typed renderer commands
│       └── renderer/
│           ├── observatory-app.tsx       # shared mature interaction application
│           ├── renderer.tsx              # Classic React/Vite entry
│           └── renderer-implementation.tsx
└── desktop-astro/
    ├── astro.config.mjs
    ├── package.json
    └── src/
        ├── pages/index.astro
        ├── layouts/ObservatoryLayout.astro
        ├── components/RendererIdentity.astro
        ├── components/WorkspaceBootShell.astro
        ├── islands/ObservatoryIsland.tsx
        ├── styles/astro-shell.css
        └── env.d.ts
packages/
├── renderer-ui/
├── platform-contracts/
├── application/
├── content-engine/
├── search-engine/
└── domain/
scripts/
├── prepare-astro-output.mjs
├── validate-astro-output.mjs
└── start-renderer.mjs
```

Astro-only presentation remains in `apps/desktop-astro`. Shared application behavior stays in the existing renderer boundary because both entries consume it. A new shared package is justified only when a second non-renderer consumer appears.

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

### 6.2 Hydration boundary decision

The implemented Astro entry uses one explicit React application island, `ObservatoryIsland`, hydrated with `client:load`. This is a deliberate product boundary rather than an unfinished migration shortcut.

Search, article selection, navigation history, reader interactions, import transactions, preferences, command routing, and Observatory diagnostics share tightly coupled state and accessibility focus behavior. Splitting them into several islands solely to increase island count would duplicate stores, add synchronization events, and increase regression risk without reducing the active interaction surface.

Astro still owns the static document shell, CSP generation, local asset topology, renderer identity, initial loading surface, and Astro-specific presentation layer. React owns only the mature interactive workspace. Future decomposition is optional and requires measured startup, memory, maintainability, or interaction benefits plus a typed state contract; it is not a release requirement.

### 6.3 React integration strategy

The official Astro React integration hosts the shared `ObservatoryApp` in the Astro shell. The Classic entry mounts the same component directly through Vite. This produces two independently built frontend entries while keeping product behavior, translations, accessibility semantics, and Electron contracts synchronized.

React is retained for complex stateful interactions because conversion has no demonstrated product or performance benefit. Static shell and renderer-specific presentation belong to Astro components and CSS; domain logic remains framework-neutral in existing packages.

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

## 13. Delivery phases and disposition

### Phase 0 — integration spike: completed

- Astro static output loads through packaged Electron-compatible relative paths.
- Forge copies the candidate output beside the Classic Vite output.
- CSP is generated with hashes for emitted inline scripts.
- Static validators reject remote URLs, root-absolute assets, missing chunks, and mismatched CSP hashes.

### Phase 1 — design foundation: completed

- Astro owns the semantic document shell and renderer identity.
- Astro-specific design treatment modernizes the command surface, panes, reading canvas, responsive compact layouts, dark/light behavior, and reduced motion without removing mature behavior.

### Phase 2 — parity bridge: completed

- The shared `ObservatoryApp` runs as the Astro interaction island.
- Existing preload, DTO, localization, accessibility, search, reader, import, preferences, and diagnostics behavior is reused rather than reimplemented.
- The complete existing Electron journey suite runs with Astro as its default fixture.

### Phase 3 — hydration review: completed with one application island

The proposed multi-island split was evaluated and intentionally not adopted. The state and focus graph is one cohesive workspace domain; one React island is the safer and smaller contract. Further splitting is optional only after evidence demonstrates a net benefit.

### Phase 4 — modern workspace UX: completed

- Astro-specific classes and tokens provide the new retained visual implementation.
- Three-pane, compact two-pane, and narrow reader modes remain usable.
- Renderer identity and switching are available in both the app and native menu.

### Phase 5 — dual-entry release candidate: completed

- Product requirements, traceability, security, testing, performance, dependency, architecture, and release documents cover both entries.
- Astro output validation, renderer-state contracts, Electron switching E2E, and four-platform packaged switching are permanent gates.

### Phase 6 — production default and permanent compatibility entry: completed

- Astro is the default renderer.
- Classic React/Vite remains a supported packaged entry rather than a temporary rollback artifact.
- Both entries ship in the same version and release asset set; no separate version line or user data migration is introduced.

## 14. Branch and PR strategy

The implementation is delivered as one cohesive branch, `agent/complete-astro-dual-renderer`, targeting `app-main` with a normal merge. The branch is retained according to repository policy.

A single integration PR is appropriate because package topology, renderer selection, CSP/output validation, E2E parity, traceability, and release behavior form one atomic product change. Follow-up frontend work may use focused branches, but neither renderer is maintained on a long-lived divergent source branch.

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

Every existing Electron journey must run against the Astro entry. New journeys cover:

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

| Risk                                                      | Mitigation                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Astro emits paths unsuitable for packaged `file:` loading | Phase 0 multi-platform spike plus static-output URL validator before feature migration |
| React islands recreate a fully hydrated SPA               | hydration budget, per-island justification, bundle report, and decomposition exit gate |
| duplicated state across islands                           | single typed state authority and contract tests                                        |
| Content Collections duplicate Content Engine behavior     | prohibit runtime workspace ownership and map any schema to existing contracts          |
| visual redesign hides mature behavior                     | parity matrix and legacy/candidate E2E on the same PR head                             |
| framework integration expands dependency attack surface   | exact pins, dependency inventory, production audit, no remote runtime assets           |
| accessibility regresses under custom panes/drawers        | accessible primitives, real Electron keyboard tests, 200% zoom, reduced motion         |
| release packages grow                                     | renderer and installed footprint gates on all targets                                  |
| migration blocks routine fixes                            | side-by-side app, focused phases, normal merge, legacy selectable until retirement     |
| renderer cutover is hard to reverse                       | explicit build selector, retained legacy output, documented rollback release procedure |

## 18. Rollback and recovery

Normal rollback is immediate and does not require rebuilding: select **Classic React/Vite** from the View menu or renderer control. The selection is persisted atomically and survives restart. `OBSERVATORY_RENDERER=classic` provides a bounded diagnostic override when the UI cannot be reached.

If an Astro entry fails to load, Electron restores the previously working renderer and rebuilds the native menu state. A release-level mitigation may change the default back to Classic while retaining the same domain, content, import, preferences, and workspace schemas.

A rollback release must still run the complete quality and four-platform package matrix, preserve both entries, state the affected Astro version, and include captured diagnostics and a re-entry criterion.

## 19. Documentation deliverables

The implementation synchronizes:

- this specification and ADR-0020;
- architecture overview and IPC contract;
- Product Spec and requirement catalog;
- Acceptance Matrix and requirements YAML;
- testing strategy and security model;
- performance budgets and dependency inventory;
- release process and desktop roadmap;
- user-facing README renderer entry guidance.

## 20. Definition of done

This specification is complete when Astro is the default packaged entry, Classic remains user-selectable, both entries share the existing Electron authority and data model, static output/CSP validation passes, every existing Electron journey runs against Astro, renderer switching and persistence are tested, both implementations satisfy per-entry footprint budgets, all four packaged targets launch and switch entries, documentation and traceability are synchronized, and a verified prerelease is published.

---
status: proposed
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0001
  - ADR-0004
  - ADR-0008
  - ADR-0016
  - ADR-0019
  - ADR-0020
---

# ADR-0021: Shared canonical content for the Deep Research Guide

## Context

Research Observatory now ships two first-class renderer entries in one Electron product:

- Astro Observatory, the default static-first renderer;
- Classic Observatory, the retained React/Vite renderer.

The product needs a substantial explanatory guide covering the Deep Research category, vendor terminology, technical concepts, timeline, limitations, archive purpose, and official sources.

The guide is editorial content rather than renderer behavior. Copying it into Astro components and React components would create two historical records that could diverge. Reading arbitrary `project-docs` files directly at runtime would also violate established packaging and content-boundary discipline.

The principal options are:

1. maintain independent prose in each renderer;
2. store the guide only as a regular article in `docs/` and open it through the article reader;
3. embed a remote documentation page;
4. place canonical structured content in a shared package and let each renderer implement its own presentation;
5. make one renderer host the guide and redirect the other renderer into it.

## Decision

Adopt option 4.

Create a repository-owned `packages/deep-research-guide/` package as the runtime and editorial authority after implementation begins. It contains:

- versioned locale content;
- stable section IDs;
- provider profiles;
- chronological timeline events;
- neutral comparison dimensions;
- official source records;
- attribution and claim-scope metadata;
- schema validation;
- a deterministic content digest.

Astro and Classic consume the same package. They may compose different UI structures suited to their frameworks, but cannot contain independent provider-history prose.

The current planning files under `project-docs/research/` are the reviewed editorial seed. During implementation they are promoted into the package, and public/project documentation is generated or verified from the same canonical data. `project-docs` does not become an unrestricted runtime content root.

## Presentation decision

- Astro renders a static-first Guide workspace with a small controller or narrowly hydrated island.
- Classic renders a full-height accessible Help Center overlay that preserves the existing workspace.
- Native Help dispatches a finite typed guide section ID to whichever renderer is active.
- Both entries expose the same guide version and content digest to tests and diagnostics.

Semantic parity is required; pixel parity is not.

## Source and neutrality policy

- Primary factual sources are official vendor announcements, official help documentation, official model announcements, and official change logs.
- Vendor performance or quality statements remain attributed as vendor claims.
- Unknown dates or model bindings remain unknown.
- The guide does not rank providers.
- DeepSeek is represented through its official Web Search / 聯網搜尋 and DeepThink / 深度思考 terminology unless an official source later establishes a standalone Deep Research product.
- Research cutoff and accessed dates are visible.

## Security decision

- All guide content and source metadata are bundled locally.
- Runtime fetching, remote scripts, remote images, iframes, fonts, or embedded vendor pages are prohibited.
- Official source links are HTTPS-only and open externally through the existing Electron safe-navigation boundary.
- Canonical Markdown passes through repository-owned rendering and sanitization.

## Consequences

### Benefits

- One correction updates both entries.
- Vendor history cannot silently diverge.
- Framework-specific UI remains possible without framework-specific facts.
- Offline operation and release reproducibility remain intact.
- Content parity becomes testable through a deterministic digest.
- Source methodology can be reviewed independently from UI code.

### Costs

- A typed editorial schema and validation tooling are required.
- Rich prose and structured timeline/comparison data need a deliberate authoring format.
- Public Markdown documentation must be generated or checked against canonical content.
- Both renderers need separate accessibility and interaction tests.
- Material vendor updates require an editorial review and guide-version decision.

## Rejected outcomes

- No remote CMS or live vendor-status panel.
- No renderer-specific copy fork.
- No redirect from Classic into Astro solely to avoid implementing Classic UX.
- No use of Astro Content Collections as authority for arbitrary user workspaces.
- No automatic provider identification from article prose.
- No claim that source-backed reports are guaranteed correct.

## Implementation evidence required before acceptance

- Shared package schema and source-integrity tests.
- Neutrality/editorial validator.
- Deterministic content digest.
- Astro and Classic DOMs reporting the same digest and record counts.
- Header, native Help, onboarding, and contextual entry journeys.
- Workspace and scroll restoration evidence.
- Safe external-link tests.
- Keyboard, reduced-motion, narrow-window, and screen-reader review.
- Windows x64, Linux x64, macOS arm64, and macOS x64 packaged smoke.
- README, website, roadmap, product requirements, architecture, security, testing, traceability, acceptance evidence, and release notes synchronized before public release.

## Related specifications

- `project-docs/product/deep-research-guide-ui-spec.md`
- `project-docs/research/deep-research-field-guide.zh-Hant.md`
- `project-docs/research/deep-research-source-register.json`
- `project-docs/audits/post-v0.1.5-documentation-and-presentation-audit.md`

---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-17
related-adrs:
  - ADR-0020
  - ADR-0021
---

# Deep Research Guide roadmap

## Outcome

Ship one source-backed explanation of the Deep Research product category in both desktop renderer entries. Astro and Classic use framework-appropriate presentation while consuming the same canonical content package, source register, section IDs, and content digest.

The program is implemented and promoted into FR-034 through FR-036 and NFR-028 through NFR-029 with repository-owned acceptance evidence.

## Stage 1 — documentation truth

- Review and merge the field guide, source register, audit, ADR-0021, and UI specification.
- Update README and public website positioning so the repository explains that it preserves long-form LLM research outputs.
- Add a public `About / Deep Research` navigation destination.
- Preserve the 2026-07-17 research cutoff in the first guide version.

Exit evidence:

- official-source links checked;
- MkDocs strict build;
- no unsupported provider names or dates;
- DeepSeek naming asymmetry explicitly preserved.

## Stage 2 — shared canonical package

- Create `packages/deep-research-guide/`.
- Promote prose, providers, timeline, comparison fields, and sources into validated locale content.
- Add schema, neutrality, source-integrity, cutoff, and digest tests.
- Generate or verify the readable documentation snapshot from canonical data.

Exit evidence:

- deterministic content digest;
- no provider-history prose in renderer directories;
- all timeline events resolve to official source IDs;
- non-HTTPS and unknown source IDs fail validation.

## Stage 3 — Astro Guide workspace

- Add top-level `說明` action.
- Add static-first Guide workspace with rail, reading canvas, and evidence inspector.
- Keep the main React workspace mounted and preserve user state.
- Add native Help command handling, onboarding, and contextual archive link.
- Validate CSP, local assets, narrow layouts, reduced motion, and no runtime guide network request.

The feature remains locally gated until Classic parity is ready.

## Stage 4 — Classic Help Center

- Add top-level `說明` action.
- Add full-height accessible Help Center overlay without introducing a router migration.
- Restore focus and preserve workspace state.
- Render the same content digest and record counts as Astro.
- Complete native Help and contextual journeys.

Exit evidence:

- semantic parity tests;
- keyboard and screen-reader review;
- same provider, timeline, comparison, and source records in both entries.

## Stage 5 — governance synchronization

Update:

- Product requirements and stable DRG requirement IDs;
- architecture and package map;
- security model;
- testing strategy;
- accessibility policy;
- localization documentation;
- traceability registry;
- acceptance evidence;
- release notes and public README/website copy.

## Stage 6 — release

Run:

- repository `verify`;
- Astro production-output and CSP validation;
- Electron E2E in Astro and Classic;
- Windows x64 package smoke;
- Linux x64 package smoke;
- macOS arm64 package smoke;
- macOS x64 package smoke;
- release manifest, checksums, CycloneDX SBOM, and asset verification.

Publish first as a prerelease. Release notes must include the guide version and research cutoff.

## Completion rule

The program is complete only when both entries expose the Guide, report the same canonical digest, work offline, preserve workspace state, open official sources through safe navigation, pass accessibility evidence, and ship in all four supported packages.


## Completion evidence

Stages 1 through 5 are complete in the implementation branch. Stage 6 is complete only after the final PR head passes repository `verify`, Electron E2E, and the four native package-smoke jobs and the resulting merge is published as a prerelease. The canonical package version is `1.0.0` with research cutoff `2026-07-17`.

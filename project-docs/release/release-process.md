---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0001
---

# Release Process

The manual desktop release entry point lives on the default branch as `.github/workflows/desktop-release.yml`. It calls the reusable implementation from `app-main` and exposes:

- `target_ref`: branch, tag, or commit to release; defaults to `app-main`.
- `requested_version`: optional exact SemVer; blank reads `package.json`.
- `channel`: `prerelease` or `stable`.
- `publish`: defaults to `false`.

## Safe operating sequence

1. Run the workflow from the default branch.
2. Start with `target_ref=app-main`, blank `requested_version`, `channel=prerelease`, and `publish=false`.
3. Preflight resolves the target to an immutable commit SHA and runs `npm run verify`.
4. Native Windows and Linux jobs build and smoke-test their packages without release-write permissions.
5. A single aggregate job creates checksums, the release manifest, and CycloneDX SBOM.
6. The release job creates or refreshes a draft, uploads the exact asset set, then reads it back and verifies names, sizes, target SHA, and draft state.
7. Only a separate run with `publish=true` may publish after all verification succeeds.

Published releases are never silently overwritten. An existing tag may only be refreshed when its release is still a draft and targets the same resolved commit.

## Verified dry run

Workflow run `29113199684` completed successfully with `publish=false` against commit `0da85343629b0add40a61be05ee9432d6786cb0e`. See `project-docs/release/verification-run-29113199684.md`.

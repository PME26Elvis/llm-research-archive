---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0007
  - ADR-0018
  - ADR-0019
---

# Release Process

The default branch exposes `.github/workflows/desktop-release.yml`; it calls the reusable implementation from `app-main`. Inputs are `target_ref` (default `app-main`), optional exact `requested_version`, `channel` (`prerelease` or `stable`), `publish` (default `false`), and optional `release_notes`.

## Verified sequence

1. Preflight validates and renders bounded structured release notes, resolves the requested ref to an immutable SHA, selects a collision-free version, applies it to the temporary build workspace, and runs `npm run verify`.
2. Native Windows x64, Linux x64, macOS arm64, and macOS x64 jobs build without release-write permission.
3. Every native job starts the packaged executable and enforces the 2 GiB package hard ceiling plus sensitive-file policy.
4. Aggregate creates the exact binary set, `SHA256SUMS.txt`, `release-manifest.json`, and CycloneDX `sbom.cdx.json`.
5. The single release-authority job creates or refreshes only a same-target draft, uploads the exact assets, reads them back, and verifies names, sizes, hashes, target SHA, and draft state.
6. `publish=true` is the only path that converts the verified draft into a public prerelease or stable release.

Published versions are immutable. Blank `requested_version` chooses the package version when free, otherwise advances from the highest occupied tag or release. An explicit version may reuse only a draft that resolves to the same target SHA.

GitHub permits each release asset to be under 2 GiB. The repository's installed-package ceiling is also 2 GiB, while release-asset validation independently rejects zero-byte, missing, extra, duplicate, or mismatched artifacts.

The earlier dry run `29113199684` proved draft-first Windows/Linux release behavior. Current Desktop CI and reusable release jobs additionally cover macOS arm64/x64, enforced coverage, accessibility, dependency audit, search benchmarks, renderer footprint, and native installed footprint.

## Structured release descriptions

`release_notes` accepts a concise comma-, semicolon-, or newline-separated list; pasted Markdown bullets are also accepted. The renderer trims bullet prefixes, removes duplicates, limits input to 20 items / 200 characters per item / 2400 total characters, and writes a `## What's changed` list followed by the standard verification section. The same generated notes file is used when creating a draft or refreshing a matching existing draft, so GitHub Releases do not fall back to an opaque one-line description.

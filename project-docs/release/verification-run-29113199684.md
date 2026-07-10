---
status: verified
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0007
---

# Desktop Release Verification — Run 29113199684

- Workflow run: https://github.com/PME26Elvis/llm-research-archive/actions/runs/29113199684
- Dispatcher ref: `main`
- Reusable workflow ref: `app-main`
- Resolved source commit: `0da85343629b0add40a61be05ee9432d6786cb0e`
- Package version / tag: `0.1.0` / `v0.1.0`
- Channel: `prerelease`
- Publish requested: `false`

## Job results

- Preflight and full `npm run verify`: passed.
- Windows x64 native package and packaged smoke: passed.
- Linux x64 native package and packaged smoke: passed.
- Aggregate checksums, manifest, and CycloneDX SBOM: passed.
- Draft release create/refresh: passed.
- Read-back release asset verification: passed.
- Publish step: intentionally skipped.

## Verified draft asset contract

The workflow verified the exact eight-asset contract:

1. `research-observatory-0.1.0-windows-x64-setup.exe`
2. `research-observatory-0.1.0-windows-x64-portable.zip`
3. `research-observatory-0.1.0-linux-x64-portable.zip`
4. `research-observatory-0.1.0-linux-x64.deb`
5. `research-observatory-0.1.0-linux-x64.rpm`
6. `SHA256SUMS.txt`
7. `release-manifest.json`
8. `sbom.cdx.json`

The verifier also confirmed draft state, immutable target commit, no duplicate or zero-byte assets, and binary sizes matching the manifest. No `publish=true` action was executed.

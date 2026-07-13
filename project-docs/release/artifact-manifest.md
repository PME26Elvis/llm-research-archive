---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0001
---

# Artifact Manifest

A complete desktop draft release contains exactly ten assets.

## Native binaries

- `research-observatory-<version>-windows-x64-setup.exe`
- `research-observatory-<version>-windows-x64-portable.zip`
- `research-observatory-<version>-linux-x64-portable.zip`
- `research-observatory-<version>-linux-x64.deb`
- `research-observatory-<version>-linux-x64.rpm`
- `research-observatory-<version>-macos-arm64.zip`
- `research-observatory-<version>-macos-x64.zip`

## Verification metadata

- `SHA256SUMS.txt`
- `release-manifest.json`
- `sbom.cdx.json`

`release-manifest.json` records the version, release tag, immutable target commit, artifact names, byte sizes, SHA-256 values, and signing state. The release verifier rejects missing, extra, duplicate, or zero-byte assets, mismatched sizes, and a release target that differs from the resolved source commit.

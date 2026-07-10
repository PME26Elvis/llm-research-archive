---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0001
---

# Release Process

Run desktop-release manually from the default branch. Provide target_ref, version, channel and publish. Matrix jobs build artifacts only. A single aggregate/release path creates draft, uploads checksums, SBOM and manifest, verifies assets, then publishes only when requested.

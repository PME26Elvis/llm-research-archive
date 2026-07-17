---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-13
related-adrs:
  - ADR-0001
  - ADR-0018
---

# Performance Budgets

| Boundary | Enforced budget | Evidence |
| --- | ---: | --- |
| Overall coverage | 80% statements / 75% branches | `npm run test:coverage` |
| Domain coverage | 95% / 90% | `scripts/verify-coverage-policy.mjs` |
| Content Engine coverage | 90% / 85% | `scripts/verify-coverage-policy.mjs` |
| Application coverage | 90% / 85% | `scripts/verify-coverage-policy.mjs` |
| Search query p95, 1k/10k | 100 ms | `npm run benchmark:search` |
| Facet/filter p95, 1k/10k | 100 ms | `npm run benchmark:search` |
| Synchronous renderer search work | 50 ms maximum | `npm run benchmark:search` |
| Interactive startup | 3 seconds development target | Electron E2E startup milestone assertion |
| Initial renderer JavaScript | 2 MiB gzip per implementation | `npm run validate:footprint:renderer` |
| Installed native package | 2 GiB hard ceiling per package root | `npm run validate:footprint:package` after packaged smoke |

The installed-package ceiling is deliberately permissive. It protects against accidental multi-gigabyte growth and release-asset failure, but package minimization is not a product goal for this small offline project. Repository-only roots and obvious secret/key material remain forbidden regardless of size.

Current dual-renderer baselines: Classic initial JavaScript is approximately 232 KiB gzip and Astro initial JavaScript is approximately 224 KiB gzip. The budget is evaluated independently so the shared package cannot hide a regression in either entry. The previous convergence baselines remain overall coverage 91.49/87.89, Content Engine 91.41/90.02, 10k query p95 2.21 ms, 10k filter p95 0.48 ms, and renderer synchronous maximum 7.14 ms.

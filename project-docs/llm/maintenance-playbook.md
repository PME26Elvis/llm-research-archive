---
status: accepted
owner: repository-maintainer
last-verified: 2026-07-10
related-adrs:
  - ADR-0001
---

# LLM Maintenance Playbook

New feature: Requirement -> Spec -> ADR if needed -> Contract -> Test -> Implementation -> Traceability check. Bug fix: Reproduce -> Regression test -> Root cause -> Minimal fix -> Full verification. IPC change: Schema -> Main handler -> Preload bridge -> Renderer client -> Contract tests -> Security review. Avoid using MkDocs as a wrapper, Node in renderer, duplicated Article types, unschematized IPC and release matrix races.

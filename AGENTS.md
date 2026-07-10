# Repository Agent Guide

Project: Research Observatory desktop archive for offline research reading.

Source of truth order: project-docs/constitution.md, accepted ADRs, product spec, architecture contracts, requirements and acceptance matrix, tests, implementation, generated docs.

Invariants: shared packages cannot import Electron; renderer cannot import Node or Electron; content root is configurable; IPC is schema validated; generated manifests are not hand edited.

Common commands: npm run verify, npm run content:manifest, npm run validate:architecture, npm run validate:traceability, npm run make.

New features follow Requirement -> Spec -> ADR when needed -> Contract -> Test -> Implementation. New IPC requires schema, main handler, preload bridge, renderer client and tests. Release jobs must not race on one GitHub Release.

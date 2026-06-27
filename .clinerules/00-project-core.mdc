---
description: Core project identity and non-negotiable rules for the account-switcher browser extension
alwaysApply: true
---

This repository is a browser extension for switching accounts across Chrome and Firefox.

Core expectations:
- Work only in source files under `src/` unless the task explicitly requires build/config updates.
- Never modify generated output under `dist/`.
- Preserve cross-browser compatibility between Chrome and Firefox.
- Follow the existing build and packaging approach already used in this repository.
- Keep changes small, reviewable, and consistent with the existing architecture.

Technology expectations:
- Use TypeScript with strict typing.
- Avoid unchecked `any`; prefer precise types, unions, guards, and shared interfaces.
- Reuse the existing module aliases: `@background/*`, `@popup/*`, `@shared/*`.

Change discipline:
- Prefer incremental edits over broad rewrites.
- If a task likely changes more than 3 files, propose a short plan first.
- Match existing naming, file organization, and message/storage conventions before introducing new abstractions.
- When changing behavior, explain the impact briefly and list the files affected.
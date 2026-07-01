---
description: TypeScript strictness and architecture rules for background, popup, and shared modules
globs: ["src/**/*.ts", "src/**/*.tsx"]
alwaysApply: false
---

TypeScript and architecture rules:
- Keep `strict: true` assumptions intact.
- Prefer explicit types for messages, storage records, and extension state.
- Use shared types/interfaces for communication between background, popup, and shared modules.
- Avoid leaking browser-specific implementation details across unrelated modules.

Architecture guidance:
- Keep business logic separate from UI rendering code.
- Keep popup logic thin; prefer shared helpers or background-driven flows for non-trivial logic.
- Reuse existing utilities before creating new abstractions.
- Prefer pure functions for parsing, transformation, validation, and state mapping.
- Use guard clauses and narrow types instead of deeply nested conditionals.
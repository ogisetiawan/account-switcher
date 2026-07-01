---
description: Testing, linting, formatting, and safe change workflow for account-switcher
globs: ["src/**/*.ts", "src/**/*.tsx", "package.json", "eslint.config.*", ".eslintrc*", ".prettierrc*"]
alwaysApply: false
---

Quality rules:
- Apply formatting and linting through the repository's existing scripts.
- Do not introduce a new formatter, linter, or test approach unless explicitly asked.
- Keep fixes scoped to the user request; avoid mixing feature work with broad refactors.

Safe change workflow:
- For bug fixes, describe the failing scenario and the smallest viable fix.
- For behavior changes, state what remains backward compatible and what changes.
- If no automated test exists, still reason through affected flows before suggesting a final change.
- When relevant, call out follow-up checks for popup behavior, background messaging, storage handling, and manifest impact.
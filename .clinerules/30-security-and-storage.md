---
description: Security, permissions, storage, and messaging rules for session-related extension logic
globs: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/manifest*.json"]
alwaysApply: false
---

This project handles account and session switching, so security is a first-class concern.

Permissions and privacy:
- Follow least-privilege permissions.
- Never add broader permissions, host permissions, or site match patterns unless explicitly requested and justified.
- Prefer optional or narrower permissions when possible.

Storage rules:
- Minimize persisted sensitive data.
- Assume extension storage is not a secure secret vault.
- Do not store plaintext secrets, passwords, raw session cookies, or long-lived sensitive tokens unless explicitly required and discussed.
- Keep the lifetime of session-related data as short as practical.
- Remove temporary or session-related state on logout, removal, or invalidation paths when applicable.

Messaging and input safety:
- Validate message payload shape and expected message types.
- Do not trust content-script or UI input without validation.
- Never log tokens, cookies, secrets, or personally identifiable data.
- Avoid unsafe DOM patterns such as injecting untrusted HTML; prefer safe text rendering.

Review behavior:
- For auth, session, storage, or permission changes, briefly explain:
  1. what data is handled,
  2. where it is stored,
  3. how long it lives,
  4. how it is cleared,
  5. why the approach is safe enough for the current architecture.
---
description: Build, manifest, and packaging rules for webpack, esbuild, and browser-specific extension output
globs: ["package.json", "tsconfig.json", "webpack.config.js", "build/**/*.js", "src/manifest*.json"]
alwaysApply: false
---

Build and packaging rules:
- Preserve the existing combination of Webpack and esbuild.
- Do not replace the current build pipeline unless explicitly asked.
- Keep browser-compatible output aligned with the configured target (`chrome88`).
- Respect the separation between generic build logic and Chrome-specific build behavior.

Manifest safety:
- Treat `src/manifest.chrome.json` and `src/manifest.firefox.json` as sensitive files.
- Do not add, remove, or broaden `permissions`, `host_permissions`, or `content_scripts.matches` unless explicitly requested.
- Avoid changes that would increase extension warnings or broaden site access without a clear need.
- Keep Chrome and Firefox packaging behavior aligned unless a browser-specific difference is required and documented.

Editing behavior:
- If changing a manifest or build file, explain why the change is needed.
- Prefer the smallest change that preserves current packaging behavior.
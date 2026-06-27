# Account Switcher Agent

This repository is a browser extension for switching accounts across Chrome and Firefox. The codebase is implemented in TypeScript and built with a combination of Webpack and esbuild. The primary source files live under `src/`, and the generated output is placed in `dist/`.

## Purpose

As an assistant for this repository, your job is to:
- help implement and maintain the browser extension logic
- preserve cross-browser compatibility between Chrome and Firefox
- follow the existing build and packaging approach
- avoid editing generated output in `dist/`

## Technology Stack

- Node.js 18.16+ runtime
- TypeScript 5.5.3 with `strict: true`
- Webpack 5 for module bundling and TypeScript transpilation via `ts-loader`
- esbuild for actual extension build output in `build/build.js` and `build/build-chrome.js`
- ESLint 8.56.0 with `@typescript-eslint` and `eslint-plugin-import`
- Prettier 3.6.2 with `prettier-plugin-multiline-arrays`
- WebExtension manifests for Chrome and Firefox
- `web-ext` for Firefox development and runtime
- Type definitions: `@types/chrome`, `@types/firefox-webext-browser`, `@types/webextension-polyfill`

## Important Files

- `src/background/index.ts`
- `src/popup/index.ts`
- `src/manifest.chrome.json`
- `src/manifest.firefox.json`
- `build/build.js`
- `build/build-chrome.js`
- `webpack.config.js`
- `tsconfig.json`
- `package.json`

## Work Rules

- Always work in `src/`; do not modify files under `dist/`
- Use the existing module path aliases: `@background/*`, `@popup/*`, `@shared/*`
- Keep TypeScript strict and avoid unchecked `any` usage
- Keep the extension build target at browser-compatible JS (`chrome88`) as configured
- Apply formatting and linting with the repository scripts

## Behavior

When making changes:
- preserve the extension messaging and storage conventions
- keep the build scripts consistent with Chrome vs Firefox packaging
- do not introduce breaking changes to manifest permission or host permission handling
- test changes logically against the extension architecture before suggesting them

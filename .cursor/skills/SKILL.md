# Account Switcher Skill

This skill describes how to work effectively in the Account Switcher repository.

## Skill Summary

The repository is a browser extension built in TypeScript with support for Chrome and Firefox. The skill should focus on:
- extension background and popup logic
- browser storage, session handling, and messaging architecture
- manifest compatibility for Chrome and Firefox
- build process using esbuild and Webpack
- linting and formatting consistency

## Use Cases

Use this skill to:
- add or update browser extension features
- fix bugs in session storage or popup UI behavior
- update manifest or permissions safely for each browser
- adjust build and packaging scripts for extension bundling
- improve TypeScript typing and shared models

## Scope

Apply this skill to the following areas:
- `src/`
- `build/`
- `package.json`
- `webpack.config.js`
- `tsconfig.json`
- `README.md`

## Constraints

- Do not edit files in `dist/`
- Preserve the existing Chrome and Firefox build flow
- Keep the repository aligned with Node.js 18+ and TypeScript strict mode
- Respect the current extension output format and directory structure

# Session Switcher Extension

Browser extension for switching sessions with support for multiple package managers.

## Installation

This project supports multiple package managers. Choose one of the following:

### Using npm

```bash
npm install
```

### Using yarn

```bash
yarn install
```

## Development

### Build Commands

Build for Chrome:

```bash
npm run build:chrome
# or
yarn build:chrome
```

Build for Firefox:

```bash
npm run build:firefox
# or
yarn build:firefox
```

### Development Commands

Run development server for Chrome:

```bash
npm run dev:chrome
# or
yarn dev:chrome
```

Run development server for Firefox:

```bash
npm run dev:firefox
# or
yarn dev:firefox
```

### Other Commands

Lint code:

```bash
npm run lint
# or
yarn lint
```

Format code:

```bash
npm run format
# or
yarn format
```

Clean build directory:

```bash
npm run clean
# or
yarn clean
```

## Project Structure

- `src/` - Source code
- `build/` - Build scripts
- `dist/` - Built extension files
- `src/manifest.chrome.json` - Chrome manifest
- `src/manifest.firefox.json` - Firefox manifest

## Building the Extension

The build process:

1. Compiles TypeScript using esbuild
2. Copies manifest files based on target browser
3. Copies popup HTML/CSS files
4. Copies assets/icons

## Package Manager Migration

This project was originally configured for Bun but has been updated to support npm and yarn:

- **npm**: Uses `package-lock.json` and `.npmrc`
- **yarn**: Uses `yarn.lock` and `.yarnrc`

## Requirements

- Node.js 18+ (for npm/yarn)
- Chrome or Firefox for testing

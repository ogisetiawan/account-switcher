# Chrome Extension Development Guide

## Overview

This guide focuses on developing and testing the Account Switcher extension for Chrome.

## Build Commands

### Build for Chrome

```bash
npm run build:chrome
```

### Development (Chrome)

```bash
npm run dev:chrome
```

## Installation in Chrome

1. **Build the extension:**

   ```bash
   npm run build:chrome
   ```

2. **Open Chrome and go to:**

   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode** (toggle in top right)

4. **Click "Load unpacked"** and select the `./dist/` folder

5. **The extension should now appear** in your extensions list

## Troubleshooting

### Extension Not Loading

- Check the console for build errors
- Ensure all files are present in `./dist/`
- Verify manifest.json is valid

### Build Errors

- Run `npm run clean` to clear previous builds
- Check that all dependencies are installed: `npm install`
- Verify TypeScript compilation: `npm run lint:check`

### Runtime Errors

- Open Chrome DevTools
- Check Console tab for error messages
- Check Background page for background script errors

## File Structure After Build

```
dist/
├── manifest.json
├── background/
│   └── index.js
├── popup/
│   ├── index.html
│   ├── index.js
│   └── style.css
└── assets/
    └── icons/
        ├── icon-16.png
        ├── icon-32.png
        ├── icon-48.png
        └── icon-128.png
```

## Development Workflow

1. Make changes to source files in `src/`
2. Run `npm run build:chrome`
3. Go to `chrome://extensions/`
4. Click the refresh icon on your extension
5. Test the changes

## Notes

- The extension targets Chrome 88+ for compatibility
- Background script runs as a service worker
- Popup script is bundled and minified for production
- All Chrome APIs are properly typed with `@types/chrome`

import { build } from "esbuild";

await build({
  entryPoints: ["src/background/index.ts"],
  bundle: true,
  outfile: "dist/background/index.js",
  platform: "browser",
  target: "chrome88", // Target Chrome instead of Firefox
  format: "iife",
  globalName: "AccountSwitcher",
  minify: false,
  sourcemap: false,
});

await build({
  entryPoints: ["src/popup/index.tsx"],
  bundle: true,
  outfile: "dist/popup/index.js",
  platform: "browser",
  target: "chrome88", // Target Chrome instead of Firefox
  format: "iife",
  minify: false,
  sourcemap: false,
  jsx: "automatic",
  loader: {
    ".tsx": "tsx",
    ".ts": "ts",
    ".css": "css"
  },
  external: ["chrome"]
});

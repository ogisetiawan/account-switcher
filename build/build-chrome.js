import { execSync } from "child_process";
import { readdir, rm, mkdir, cp } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const popupSrc = path.join(rootDir, "src", "popup");
const assetsDir = path.join(rootDir, "src", "assets");

const distDir = path.join(rootDir, "dist");
const popupDist = path.join(distDir, "popup");

console.log("Building Acccont Switcher Extension for Chrome...");

// Clean previous build
try {
  await rm(distDir, { recursive: true, force: true });
} catch (_error) {
  // Directory might not exist, continue
}

// Create directory structure
await mkdir(path.join(distDir, "background"), { recursive: true });
await mkdir(popupDist, { recursive: true });

// Compile background script
console.log("Compiling background script...");
try {
  const backgroundCmd = "npx esbuild src/background/index.ts --bundle --platform=browser --target=chrome88 --format=iife --outfile=dist/background/index.js";
  console.log(`Running: ${backgroundCmd}`);
  execSync(backgroundCmd, {
    stdio: "inherit",
    cwd: rootDir,
  });
} catch (error) {
  console.error("❌ Failed to compile background script");
  console.error("Error details:", error.message);
  process.exit(1);
}

// Compile popup script with React and Tailwind
console.log("Compiling popup script with React...");
try {
  const popupCmd = 'npx esbuild src/popup/index.tsx --bundle --platform=browser --target=chrome88 --format=iife --outfile=dist/popup/index.js --jsx=automatic --loader:.tsx=tsx --loader:.ts=ts --loader:.css=css --external:chrome';
  console.log(`Running: ${popupCmd}`);
  execSync(popupCmd, {
    stdio: "inherit",
    cwd: rootDir,
  });
} catch (error) {
  console.error("❌ Failed to compile popup script");
  console.error("Error details:", error.message);
  process.exit(1);
}

// Process CSS with Tailwind
console.log("Processing CSS with Tailwind...");
try {
  const tailwindCmd = `npx tailwindcss -i ${path.join(popupSrc, "globals.css")} -o ${path.join(distDir, "popup", "styles.css")} --content "./src/**/*.{html,js,ts,jsx,tsx}" --minify`;
  console.log(`Running: ${tailwindCmd}`);
  execSync(tailwindCmd, {
    stdio: "inherit",
    cwd: rootDir,
  });
} catch (error) {
  console.error("❌ Failed to process CSS with Tailwind");
  console.error("Error details:", error.message);
  process.exit(1);
}

// Copy Chrome manifest
console.log("Copying Chrome manifest...");
await cp(path.join(rootDir, "src/manifest.chrome.json"), path.join(distDir, "manifest.json"));

// Copy popup HTML and CSS files
console.log("Copying popup files...");
const popupFiles = await readdir(popupSrc);
for (const file of popupFiles) {
  if (file.endsWith(".html") || file.endsWith(".css")) {
    await cp(path.join(popupSrc, file), path.join(popupDist, file));
  }
}

// Copy assets/icons
try {
  await cp(assetsDir, path.join(distDir, "assets"), { recursive: true });
} catch {
  console.log("⚠️ No assets directory found");
}

console.log("✅ Chrome build complete! Extension files are in ./dist/");
console.log("👉 To install: Load ./dist/ as unpacked extension in Chrome");

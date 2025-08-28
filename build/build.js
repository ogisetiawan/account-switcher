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

const target = process.argv[2];
if (!["firefox", "chrome"].includes(target)) {
  console.error("❌ Please specify a target: 'firefox' or 'chrome'");
  process.exit(1);
}

console.log(`Building Session Switcher Extension for ${target}...`);

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
  const backgroundCmd = `npx esbuild src/background/index.ts --bundle --platform=browser --target=chrome88 --format=iife --outfile=dist/background/index.js`;
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

// Compile popup script
console.log("Compiling popup script...");
try {
  const popupCmd = `npx esbuild src/popup/index.ts --bundle --platform=browser --target=chrome88 --format=iife --outfile=dist/popup/index.js`;
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

// Copy correct manifest file
console.log("Copying manifest...");
const manifestSrc =
  target === "firefox"
    ? path.join(rootDir, "src/manifest.firefox.json")
    : path.join(rootDir, "src/manifest.chrome.json");

await cp(manifestSrc, path.join(distDir, "manifest.json"));

// Copy popup/*.html and *.css
console.log("Copying popup files...");
const popupFiles = await readdir(popupSrc);
for (const file of popupFiles) {
  if (file.endsWith(".html") || file.endsWith(".css")) {
    await cp(path.join(popupSrc, file), path.join(popupDist, file));
  }
}

// Copy icons/assets folder if exists
try {
  await cp(assetsDir, path.join(distDir, "assets"), { recursive: true });
} catch {
  console.log("⚠️ No icons directory found");
}

console.log("✅ Build complete! Extension files are in ./dist/");
console.log("👉 To install: Load ./dist/ as unpacked extension in browser");

import { rm } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

console.log("🧹 Cleaning dist directory...");

try {
  await rm(distDir, { recursive: true, force: true });
  console.log("✅ Dist directory cleaned successfully!");
} catch (error) {
  console.log("⚠️ Dist directory doesn't exist or already cleaned");
}

/**
 * Simple Test Server untuk Session Switcher Extension
 * Menjalankan extension test tanpa perlu load ke Chrome
 */

import { createServer } from "http";
import { readFile } from "fs/promises";
import { extname, join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;
const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const server = createServer(async (req, res) => {
  try {
    let filePath = req.url === "/" ? "/popup-test.html" : req.url;

    // Remove leading slash
    filePath = filePath.substring(1);

    // Security: prevent directory traversal
    if (filePath.includes("..")) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // Determine full path
    let fullPath;
    if (filePath.startsWith("dist/")) {
      fullPath = join(__dirname, "..", filePath);
    } else {
      fullPath = join(__dirname, filePath);
    }

    // Read file
    const content = await readFile(fullPath);

    // Set content type
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "text/plain";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404);
      res.end("File not found");
    } else {
      console.error("Server error:", error);
      res.writeHead(500);
      res.end("Internal server error");
    }
  }
});

server.listen(PORT, () => {
  console.log("🚀 Test Server started!");
  console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
  console.log("");
  console.log("📋 Available test pages:");
  console.log(`   • Main test: http://localhost:${PORT}/popup-test.html`);
  console.log(`   • Extension files: http://localhost:${PORT}/dist/`);
  console.log("");
  console.log("💡 Press Ctrl+C to stop the server");
  console.log("=====================================");
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down test server...");
  server.close(() => {
    console.log("✅ Test server stopped");
    process.exit(0);
  });
});

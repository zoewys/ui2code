#!/usr/bin/env node

/**
 * Auto-install dependencies entry point for the UI2Code MCP server.
 * Checks that required packages exist in node_modules; if any are missing,
 * runs `npm install` synchronously before launching the server.
 */

import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = join(__dirname, "..");

// Required packages that must be present before starting the server
const requiredPackages = ["pixelmatch", "pngjs", "playwright"];

const missing = requiredPackages.filter(
  (pkg) => !existsSync(join(pluginRoot, "node_modules", pkg)),
);

if (missing.length > 0) {
  console.error(
    `[ui2code] Installing missing dependencies: ${missing.join(", ")}`,
  );
  const result = spawnSync("npm", ["install"], {
    cwd: pluginRoot,
    // stdout → stderr so npm output never corrupts the JSON-RPC stream
    stdio: ["ignore", process.stderr, "inherit"],
    shell: true,
  });
  if (result.status !== 0) {
    console.error("[ui2code] npm install failed with status", result.status);
    process.exit(1);
  }
}

// Change to plugin root so relative imports resolve correctly
process.chdir(pluginRoot);

// Launch the MCP server
await import("../mcp/server.mjs");

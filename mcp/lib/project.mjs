import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const STATE_DIR = ".ui2code";

function ensureStateDir(projectDir) {
  const dir = path.join(projectDir, STATE_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function saveSelection({ projectDir, selection }) {
  const dir = ensureStateDir(projectDir);
  const filePath = path.join(dir, "selection.json");
  writeFileSync(filePath, JSON.stringify(selection, null, 2), "utf8");
  return { ok: true, path: filePath };
}

export function getSelection({ projectDir }) {
  const filePath = path.join(projectDir, STATE_DIR, "selection.json");
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function resolveProjectDir(projectDir) {
  if (!projectDir) {
    throw new Error("projectDir is required");
  }
  const resolved = path.resolve(projectDir);
  if (!existsSync(resolved)) {
    throw new Error(`Project directory does not exist: ${resolved}`);
  }
  return resolved;
}

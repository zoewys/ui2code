import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const HISTORY_DIR = ".ui2code";
const HISTORY_FILE = "history.json";

function historyPath(projectDir) {
  return path.join(projectDir, HISTORY_DIR, HISTORY_FILE);
}

function ensureDir(projectDir) {
  const dir = path.join(projectDir, HISTORY_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadHistory(projectDir) {
  const p = historyPath(projectDir);
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return [];
  }
}

function saveHistory(projectDir, history) {
  ensureDir(projectDir);
  writeFileSync(historyPath(projectDir), JSON.stringify(history, null, 2), "utf8");
}

export function getRefineHistory({ projectDir }) {
  const entries = loadHistory(projectDir);
  // Return without full screenshot data to keep response small
  return {
    entries: entries.map((e, i) => ({
      index: i,
      timestamp: e.timestamp,
      instruction: e.instruction,
      similarity: e.similarity,
      files: e.files,
      elementContext: e.elementContext || null,
    })),
    total: entries.length,
  };
}

export function saveRefineEntry(projectDir, entry) {
  // entry: { timestamp, instruction, elementContext, beforeScreenshot, afterScreenshot, similarity, files }
  const history = loadHistory(projectDir);
  history.push({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  saveHistory(projectDir, history);
}

export function undoLastRefine({ projectDir }) {
  const history = loadHistory(projectDir);
  if (history.length === 0) {
    return { ok: false, message: "No refine history to undo." };
  }

  const last = history[history.length - 1];

  // Check if we're in a git repo
  try {
    execSync("git rev-parse --is-inside-work-tree", { cwd: projectDir, stdio: "pipe" });
  } catch {
    return { ok: false, message: "Project is not a git repository. Cannot undo." };
  }

  // Revert only the files that were modified
  const revertedFiles = [];
  for (const file of last.files || []) {
    try {
      execSync(`git checkout HEAD~1 -- "${file}"`, { cwd: projectDir, stdio: "pipe" });
      revertedFiles.push(file);
    } catch (err) {
      console.error(`Failed to revert ${file}:`, err.message);
    }
  }

  if (revertedFiles.length === 0) {
    return { ok: false, message: "Could not revert any files. They may have been committed separately." };
  }

  // Remove the last entry from history
  history.pop();
  saveHistory(projectDir, history);

  return {
    ok: true,
    revertedFiles,
    message: `Reverted ${revertedFiles.length} file(s): ${revertedFiles.join(", ")}`,
  };
}

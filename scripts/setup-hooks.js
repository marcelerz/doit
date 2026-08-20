#!/usr/bin/env node

/**
 * Setup script to install git hooks
 * Copies scripts/pre-commit into the repository's hooks directory.
 *
 * Runs from `postinstall`, so it must never fail an install. A missing or
 * unwritable hooks directory is a warning, not an error.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const sourceHook = path.join(projectRoot, "scripts", "pre-commit");

/**
 * Resolve the real hooks directory.
 *
 * `path.join(root, ".git", "hooks")` is wrong inside a worktree or submodule,
 * where `.git` is a *file* pointing elsewhere - mkdirSync then throws ENOTDIR.
 * `git rev-parse --git-path hooks` gives the right answer in every layout.
 */
function resolveHooksDir() {
  try {
    const output = execFileSync("git", ["rev-parse", "--git-path", "hooks"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return path.resolve(projectRoot, output);
  } catch {
    return null;
  }
}

function setupHooks() {
  const gitHooksDir = resolveHooksDir();
  if (gitHooksDir === null) {
    console.log("Not a git repository, skipping hook setup");
    return;
  }

  if (!fs.existsSync(sourceHook)) {
    console.warn("Warning: scripts/pre-commit not found, skipping hook setup");
    return;
  }

  try {
    fs.mkdirSync(gitHooksDir, { recursive: true });
    const targetHook = path.join(gitHooksDir, "pre-commit");
    fs.copyFileSync(sourceHook, targetHook);
    // Make it executable (Unix systems)
    fs.chmodSync(targetHook, 0o755);
    console.log("Git pre-commit hook installed successfully");
  } catch (error) {
    console.warn(`Warning: could not install git pre-commit hook: ${error.message}`);
  }
}

setupHooks();

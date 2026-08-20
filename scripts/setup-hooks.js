#!/usr/bin/env node

/**
 * Setup script to install git hooks
 * Copies scripts/pre-commit to .git/hooks/pre-commit
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const sourceHook = path.join(projectRoot, "scripts", "pre-commit");
const gitHooksDir = path.join(projectRoot, ".git", "hooks");
const targetHook = path.join(gitHooksDir, "pre-commit");

function setupHooks() {
  // Check if we're in a git repository
  if (!fs.existsSync(path.join(projectRoot, ".git"))) {
    console.log("Not a git repository, skipping hook setup");
    return;
  }

  // Create hooks directory if it doesn't exist
  if (!fs.existsSync(gitHooksDir)) {
    fs.mkdirSync(gitHooksDir, { recursive: true });
  }

  // Check if source hook exists
  if (!fs.existsSync(sourceHook)) {
    console.error("Error: scripts/pre-commit not found");
    process.exit(1);
  }

  // Copy the hook
  try {
    fs.copyFileSync(sourceHook, targetHook);
    // Make it executable (Unix systems)
    fs.chmodSync(targetHook, 0o755);
    console.log("Git pre-commit hook installed successfully");
  } catch (error) {
    console.error("Error installing git hook:", error.message);
    process.exit(1);
  }
}

setupHooks();

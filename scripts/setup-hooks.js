#!/usr/bin/env node

/**
 * Setup script to install git hooks
 * Copies scripts/pre-commit into the repository's hooks directory.
 *
 * Runs from `postinstall`, so it must never fail an install. A missing or
 * unwritable hooks directory is a warning, not an error.
 *
 * It installs doit's own hook and nothing else. A pre-commit hook the
 * developer already has -- a secret scanner, a shared team hook -- is left
 * exactly as it is.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const sourceHook = path.join(projectRoot, "scripts", "pre-commit");

/** A hook carrying this line is ours to overwrite. scripts/pre-commit has it. */
const MARKER = "# doit-managed-hook";

/**
 * SHA-256 of the hook as shipped before the marker existed (its content never
 * changed in that time). Without this every existing checkout would keep the
 * old hook forever, because an unmarked hook is otherwise somebody else's.
 */
const PRE_MARKER_HOOK_SHA256 = [
  "b235c37db84ebda6319abc6cf23a7deb8150fd95328fa3bd127049f4749f05ba",
];

function git(args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/**
 * Resolve the real hooks directory.
 *
 * `path.join(root, ".git", "hooks")` is wrong inside a worktree or submodule,
 * where `.git` is a *file* pointing elsewhere - mkdirSync then throws ENOTDIR.
 * `git rev-parse --git-path hooks` gives the right answer in every layout.
 */
function resolveHooksDir() {
  try {
    return path.resolve(projectRoot, git(["rev-parse", "--git-path", "hooks"]));
  } catch {
    return null;
  }
}

/**
 * The configured core.hooksPath, from any scope, or "" when there is none.
 *
 * `git rev-parse --git-path hooks` honours it, so with a global hooksPath the
 * "repository's hooks directory" is a directory shared by every repository on
 * the machine.
 */
function configuredHooksPath() {
  try {
    return git(["config", "--get", "core.hooksPath"]);
  } catch {
    // `git config --get` exits 1 when the key is not set.
    return "";
  }
}

function isManagedHook(content) {
  if (content.split(/\r?\n/).includes(MARKER)) {
    return true;
  }
  const normalised = content.replace(/\r\n/g, "\n");
  const digest = crypto.createHash("sha256").update(normalised).digest("hex");
  return PRE_MARKER_HOOK_SHA256.includes(digest);
}

function setupHooks() {
  if (process.env.CI) {
    console.log("CI detected, skipping git hook setup");
    return;
  }

  const gitHooksDir = resolveHooksDir();
  if (gitHooksDir === null) {
    console.log("Not a git repository, skipping hook setup");
    return;
  }

  if (!fs.existsSync(sourceHook)) {
    console.warn("Warning: scripts/pre-commit not found, skipping hook setup");
    return;
  }

  const hooksPath = configuredHooksPath();
  if (hooksPath !== "") {
    console.warn(`Warning: core.hooksPath is set (${hooksPath}), so the doit pre-commit hook was not installed.`);
    console.warn("To bump the version on commit, call scripts/pre-commit from your own pre-commit hook.");
    return;
  }

  try {
    const targetHook = path.join(gitHooksDir, "pre-commit");
    if (fs.existsSync(targetHook) && !isManagedHook(fs.readFileSync(targetHook, "utf8"))) {
      console.warn(`Warning: an existing pre-commit hook was left untouched: ${targetHook}`);
      console.warn("To bump the version on commit, call scripts/pre-commit from it,");
      console.warn("or remove it and run `npm run setup:hooks`.");
      return;
    }

    fs.mkdirSync(gitHooksDir, { recursive: true });
    fs.copyFileSync(sourceHook, targetHook);
    // Make it executable (Unix systems)
    fs.chmodSync(targetHook, 0o755);
    console.log("Git pre-commit hook installed successfully");
  } catch (error) {
    console.warn(`Warning: could not install git pre-commit hook: ${error.message}`);
  }
}

setupHooks();

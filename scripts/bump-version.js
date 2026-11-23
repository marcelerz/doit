#!/usr/bin/env node

/**
 * CLI helper for manually bumping major/minor versions
 *
 * Usage:
 *   node scripts/bump-version.js major  # 0.1.5 → 1.0.0
 *   node scripts/bump-version.js minor  # 0.1.5 → 0.2.0
 */

const path = require("path");
const { readVersion, writeVersion, formatVersion } = require("./version-file");

const versionFile = path.join(__dirname, "..", "version.json");

function bumpVersion(type) {
  if (type !== "major" && type !== "minor") {
    console.error('Usage: node scripts/bump-version.js <major|minor>');
    process.exit(1);
  }

  // Read current version
  let current;
  try {
    current = readVersion(versionFile);
  } catch (error) {
    console.error("Error reading version.json:", error.message);
    process.exit(1);
  }

  // Bump version based on type
  const next =
    type === "major"
      ? { major: current.major + 1, minor: 0, revision: 0 }
      : { major: current.major, minor: current.minor + 1, revision: 0 };

  // Write updated version
  try {
    writeVersion(versionFile, next);
    console.log(`Version bumped: ${formatVersion(current)} -> ${formatVersion(next)}`);
  } catch (error) {
    console.error("Error writing version.json:", error.message);
    process.exit(1);
  }
}

const type = process.argv[2];
bumpVersion(type);

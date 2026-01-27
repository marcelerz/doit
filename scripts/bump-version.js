#!/usr/bin/env node

/**
 * CLI helper for manually bumping major/minor versions
 *
 * Usage:
 *   node scripts/bump-version.js major  # 0.1.5 → 1.0.0
 *   node scripts/bump-version.js minor  # 0.1.5 → 0.2.0
 */

const fs = require("fs");
const path = require("path");

const versionFile = path.join(__dirname, "..", "version.json");

function bumpVersion(type) {
  // Read current version
  let versionData;
  try {
    versionData = JSON.parse(fs.readFileSync(versionFile, "utf-8"));
  } catch (error) {
    console.error("Error reading version.json:", error.message);
    process.exit(1);
  }

  const oldVersion = `${versionData.major}.${versionData.minor}.${versionData.revision}`;

  // Bump version based on type
  switch (type) {
    case "major":
      versionData.major += 1;
      versionData.minor = 0;
      versionData.revision = 0;
      break;
    case "minor":
      versionData.minor += 1;
      versionData.revision = 0;
      break;
    default:
      console.error('Usage: node scripts/bump-version.js <major|minor>');
      process.exit(1);
  }

  const newVersion = `${versionData.major}.${versionData.minor}.${versionData.revision}`;

  // Write updated version
  try {
    fs.writeFileSync(
      versionFile,
      JSON.stringify(versionData, null, 2) + "\n",
      "utf-8"
    );
    console.log(`Version bumped: ${oldVersion} -> ${newVersion}`);
  } catch (error) {
    console.error("Error writing version.json:", error.message);
    process.exit(1);
  }
}

const type = process.argv[2];
bumpVersion(type);

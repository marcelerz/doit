#!/usr/bin/env node

/**
 * fix-github-pages.js
 *
 * Fixes Next.js static exports for GitHub Pages hosting by:
 * 1. Adding a .nojekyll file to disable Jekyll processing
 * 2. Creating 404.html for SPA routing
 * 3. Updating site.webmanifest with /doit/ basePath
 * 4. Stamping the build version into sw.js so each deploy ships a new worker
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const outDir = "out";
const outDirPath = path.resolve(process.cwd(), outDir);

// Check if output directory exists
if (!fs.existsSync(outDirPath)) {
  console.error(`Error: Output directory "${outDir}" does not exist.`);
  console.error('Make sure to run "npm run build" first.');
  process.exit(1);
}

console.log(`🔧 Fixing Next.js build for GitHub Pages...`);

// Step 1: Add .nojekyll file
const nojekyllPath = path.join(outDirPath, ".nojekyll");
fs.writeFileSync(nojekyllPath, "");
console.log(`✅ Created .nojekyll file`);

// Step 2: Copy index.html to 404.html for SPA routing
const indexPath = path.join(outDirPath, "index.html");
const notFoundPath = path.join(outDirPath, "404.html");

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log(`✅ Created 404.html (copy of index.html for SPA routing)`);
} else {
  console.log(`⚠️  index.html not found, skipping 404.html creation`);
}

// Step 3: Update site.webmanifest with /doit/ basePath
const manifestPath = path.join(outDirPath, "site.webmanifest");
if (fs.existsSync(manifestPath)) {
  const before = fs.readFileSync(manifestPath, "utf8");
  const manifest = before
    .replace('"start_url": "/"', '"start_url": "/doit/"')
    .replace('"scope": "/"', '"scope": "/doit/"')
    .replace('"id": "/"', '"id": "/doit/"')
    .replace(/"\s*\/android-chrome-/g, '"/doit/android-chrome-');
  fs.writeFileSync(manifestPath, manifest, "utf8");

  // These are exact-string replacements. Reformatting site.webmanifest would
  // silently leave start_url pointing at "/" on the deployed site, so fail
  // loudly rather than shipping a manifest that sends users to the wrong path.
  const stillRooted = ['"start_url": "/"', '"scope": "/"', '"id": "/"'].filter((needle) =>
    manifest.includes(needle),
  );
  if (stillRooted.length > 0) {
    console.error(`Error: site.webmanifest still contains ${stillRooted.join(", ")}`);
    console.error("The exact-match replacements in this script are out of date.");
    process.exit(1);
  }
  console.log(`✅ Updated site.webmanifest with /doit/ basePath`);
}

// Step 4: Stamp the build version into sw.js
const swPath = path.join(outDirPath, "sw.js");
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, "utf8");
  if (!sw.includes("__BUILD_VERSION__")) {
    console.error("Error: sw.js has no __BUILD_VERSION__ placeholder.");
    console.error("Without it the worker is byte-identical across deploys and never updates.");
    process.exit(1);
  }
  const { major, minor, revision } = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "version.json"), "utf8"),
  );
  const version = `${major}.${minor}.${revision}`;
  fs.writeFileSync(swPath, sw.replaceAll("__BUILD_VERSION__", version), "utf8");
  console.log(`✅ Stamped sw.js with build version ${version}`);
} else {
  console.log(`⚠️  sw.js not found in ${outDir}, skipping version stamp`);
}

console.log(`\n✨ Done! Your Next.js build is ready for GitHub Pages.`);

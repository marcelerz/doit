#!/usr/bin/env node

/**
 * fix-github-pages.js
 *
 * Fixes Next.js static exports for GitHub Pages hosting by:
 * 1. Adding a .nojekyll file to disable Jekyll processing
 * 2. Creating 404.html for SPA routing
 * 3. Updating site.webmanifest with /doit/ basePath
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
  let manifest = fs.readFileSync(manifestPath, "utf8");
  manifest = manifest
    .replace('"start_url": "/"', '"start_url": "/doit/"')
    .replace('"scope": "/"', '"scope": "/doit/"')
    .replace('"id": "/"', '"id": "/doit/"')
    .replace(/"\s*\/android-chrome-/g, '"/doit/android-chrome-');
  fs.writeFileSync(manifestPath, manifest, "utf8");
  console.log(`✅ Updated site.webmanifest with /doit/ basePath`);
}

console.log(`\n✨ Done! Your Next.js build is ready for GitHub Pages.`);

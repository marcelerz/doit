#!/usr/bin/env node

/**
 * fix-github-pages.js
 *
 * This script fixes Next.js static exports for GitHub Pages hosting by:
 * 1. Adding a .nojekyll file to disable Jekyll processing
 * 2. Optionally renaming _next folder to avoid Jekyll ignoring it
 * 3. Updating all references in HTML, JS, and CSS files
 *
 * Usage:
 *   node scripts/fix-github-pages.js [options]
 *
 * Options:
 *   --out-dir <dir>     Output directory (default: "out")
 *   --rename-to <name>  Rename _next to this (default: just adds .nojekyll)
 *   --help              Show help
 */

const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
let outDir = "out";
let renameTo = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out-dir" && args[i + 1]) {
    outDir = args[i + 1];
    i++;
  } else if (args[i] === "--rename-to" && args[i + 1]) {
    renameTo = args[i + 1];
    i++;
  } else if (args[i] === "--help") {
    console.log(`
fix-github-pages.js - Fix Next.js static exports for GitHub Pages

Usage:
  node scripts/fix-github-pages.js [options]

Options:
  --out-dir <dir>     Output directory (default: "out")
  --rename-to <name>  Rename _next folder to this name (e.g., "assets")
                      If not specified, only adds .nojekyll file
  --help              Show this help message

Examples:
  # Just add .nojekyll file (simplest solution)
  node scripts/fix-github-pages.js

  # Rename _next to "assets" and update all references
  node scripts/fix-github-pages.js --rename-to assets

  # Use custom output directory
  node scripts/fix-github-pages.js --out-dir build --rename-to assets
`);
    process.exit(0);
  }
}

const outDirPath = path.resolve(process.cwd(), outDir);

// Check if output directory exists
if (!fs.existsSync(outDirPath)) {
  console.error(`Error: Output directory "${outDir}" does not exist.`);
  console.error('Make sure to run "npm run build" first.');
  process.exit(1);
}

console.log(`\n🔧 Fixing Next.js build for GitHub Pages...`);
console.log(`   Output directory: ${outDirPath}`);

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
  // Update paths to include /doit/ prefix
  manifest = manifest
    .replace('"start_url": "/"', '"start_url": "/doit/"')
    .replace('"scope": "/"', '"scope": "/doit/"')
    .replace('"id": "/"', '"id": "/doit/"')
    .replace(/"\s*\/android-chrome-/g, '"/doit/android-chrome-');
  fs.writeFileSync(manifestPath, manifest, "utf8");
  console.log(`✅ Updated site.webmanifest with /doit/ basePath`);
}

// If no rename requested, we're done
if (!renameTo) {
  console.log(`\n✨ Done! Your Next.js build is ready for GitHub Pages.`);
  process.exit(0);
}

// Step 3: Rename _next folder
const nextDirPath = path.join(outDirPath, "_next");
const newDirPath = path.join(outDirPath, renameTo);

if (!fs.existsSync(nextDirPath)) {
  console.error(`Error: "_next" folder not found in "${outDir}".`);
  process.exit(1);
}

if (fs.existsSync(newDirPath)) {
  console.log(`⚠️  Removing existing "${renameTo}" folder...`);
  fs.rmSync(newDirPath, { recursive: true, force: true });
}

fs.renameSync(nextDirPath, newDirPath);
console.log(`✅ Renamed _next → ${renameTo}`);

// Step 3: Update all references in files
const filesToUpdate = [];

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectFiles(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if ([".html", ".js", ".css", ".json", ".txt", ".xml"].includes(ext)) {
        filesToUpdate.push(fullPath);
      }
    }
  }
}

collectFiles(outDirPath);

console.log(`📝 Updating references in ${filesToUpdate.length} files...`);

let updatedCount = 0;
const patterns = [
  // Various ways _next might be referenced
  { find: /_next\//g, replace: `${renameTo}/` },
  { find: /"_next"/g, replace: `"${renameTo}"` },
  { find: /'_next'/g, replace: `'${renameTo}'` },
  { find: /\/_next/g, replace: `/${renameTo}` },
];

for (const filePath of filesToUpdate) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  for (const pattern of patterns) {
    if (pattern.find.test(content)) {
      content = content.replace(pattern.find, pattern.replace);
      modified = true;
    }
    // Reset regex lastIndex
    pattern.find.lastIndex = 0;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    updatedCount++;
  }
}

console.log(`✅ Updated ${updatedCount} files`);

console.log(`\n✨ Done! Your Next.js build is ready for GitHub Pages.`);
console.log(`\nTo deploy, push the contents of "${outDir}" to your gh-pages branch.`);

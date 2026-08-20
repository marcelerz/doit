#!/usr/bin/env node

/**
 * build-gh-pages.js
 *
 * Builds the Next.js app for GitHub Pages deployment.
 * Deployment is handled by CI/CD via peaceiris/actions-gh-pages.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");

console.log("\n🚀 Building for GitHub Pages...\n");

// Step 1: Run Next.js build
try {
  console.log("🔨 Running Next.js build...\n");
  execSync("npx next build", { stdio: "inherit" });
  console.log("");
} catch {
  console.error("\n❌ Build failed!");
  process.exit(1);
}

// Step 2: Run fix-github-pages script
try {
  console.log("🔧 Running fix-github-pages...\n");
  execSync("node scripts/fix-github-pages.js", { stdio: "inherit" });
} catch {
  console.error("\n❌ fix-github-pages failed!");
  process.exit(1);
}

console.log("\n✨ Build complete! The out/ folder is ready for deployment.");

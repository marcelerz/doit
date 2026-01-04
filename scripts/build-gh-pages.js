#!/usr/bin/env node

/**
 * build-gh-pages.js
 *
 * This script builds the Next.js app for GitHub Pages while preserving
 * the .git folder in the out directory (for easy deployment).
 *
 * It:
 * 1. Backs up the .git folder from out/ (if it exists)
 * 2. Runs the Next.js build
 * 3. Runs the fix-github-pages.js script
 * 4. Restores the .git folder
 *
 * Usage:
 *   node scripts/build-gh-pages.js [--deploy]
 *
 * Options:
 *   --deploy    After building, commit and push to GitHub Pages
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Parse command line arguments
const args = process.argv.slice(2);
const shouldDeploy = args.includes("--deploy");

const outDir = "out";
const backupDir = ".git-backup-temp";
const outDirPath = path.resolve(process.cwd(), outDir);
const gitPath = path.join(outDirPath, ".git");
const backupPath = path.resolve(process.cwd(), backupDir);

console.log("\n🚀 Building for GitHub Pages...\n");

// Step 1: Backup .git folder if it exists
let hadGitFolder = false;
if (fs.existsSync(gitPath)) {
  console.log("📦 Backing up .git folder from out/...");

  // Remove old backup if exists
  if (fs.existsSync(backupPath)) {
    fs.rmSync(backupPath, { recursive: true, force: true });
  }

  // Move .git to backup location
  fs.renameSync(gitPath, backupPath);
  hadGitFolder = true;
  console.log("✅ .git folder backed up\n");
}

// Step 2: Run Next.js build
try {
  console.log("🔨 Running Next.js build...\n");
  execSync("npx next build", { stdio: "inherit" });
  console.log("");
} catch (error) {
  console.error("\n❌ Build failed!");

  // Restore .git folder on failure
  if (hadGitFolder && fs.existsSync(backupPath)) {
    console.log("📦 Restoring .git folder...");
    if (!fs.existsSync(outDirPath)) {
      fs.mkdirSync(outDirPath, { recursive: true });
    }
    fs.renameSync(backupPath, gitPath);
  }

  process.exit(1);
}

// Step 3: Run fix-github-pages script
try {
  console.log("🔧 Running fix-github-pages...\n");
  execSync("node scripts/fix-github-pages.js", { stdio: "inherit" });
} catch (error) {
  console.error("\n⚠️ fix-github-pages failed, but continuing...");
}

// Step 4: Restore .git folder
if (hadGitFolder && fs.existsSync(backupPath)) {
  console.log("\n📦 Restoring .git folder to out/...");
  fs.renameSync(backupPath, gitPath);
  console.log("✅ .git folder restored");
}

console.log("\n✨ Build complete! Your out/ folder is ready for deployment.");

// Step 5: Deploy if --deploy flag is set
if (shouldDeploy && hadGitFolder) {
  console.log("\n🚀 Deploying to GitHub Pages...");
  try {
    execSync("git add .", { cwd: outDirPath, stdio: "inherit" });

    // Check if there are changes to commit
    const status = execSync("git status --porcelain", { cwd: outDirPath, encoding: "utf8" });
    if (status.trim() === "") {
      console.log("\n✅ No changes to deploy.");
    } else {
      execSync('git commit -m "Update Website"', { cwd: outDirPath, stdio: "inherit" });
      execSync("git push", { cwd: outDirPath, stdio: "inherit" });
      console.log("\n✅ Successfully deployed to GitHub Pages!");
    }
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
} else if (shouldDeploy && !hadGitFolder) {
  console.error("\n❌ Cannot deploy: No .git folder found in out/");
  console.log("\n💡 To set up deployments, initialize a git repo in out/:");
  console.log("   cd out");
  console.log("   git init");
  console.log("   git remote add origin <your-gh-pages-repo-url>");
  console.log("   git checkout -b gh-pages");
  process.exit(1);
} else if (hadGitFolder) {
  console.log("\n📝 To deploy to GitHub Pages:");
  console.log("   cd out");
  console.log("   git add .");
  console.log('   git commit -m "Deploy"');
  console.log("   git push");
  console.log("\n💡 Or run: npm run deploy:gh-pages");
} else {
  console.log("\n💡 Tip: To set up easy deployments, initialize a git repo in out/:");
  console.log("   cd out");
  console.log("   git init");
  console.log("   git remote add origin <your-gh-pages-repo-url>");
  console.log("   git checkout -b gh-pages");
  console.log("\n   Then future builds will preserve the .git folder.");
}

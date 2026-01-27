import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

function getVersion(): string {
  try {
    const versionPath = join(process.cwd(), "version.json");
    const versionData = JSON.parse(readFileSync(versionPath, "utf-8"));
    return `${versionData.major}.${versionData.minor}.${versionData.revision}`;
  } catch {
    return "0.0.0";
  }
}

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_APP_VERSION: getVersion(),
  },
  poweredByHeader: false,
  reactStrictMode: true,
  // Only use basePath for GitHub Pages deployment
  ...(isGitHubPages && {
    basePath: "/doit",
    assetPrefix: "/doit/",
    output: "export",
  }),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

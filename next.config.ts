import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Since 16.4, `next dev` writes an AGENTS.md into the project root when it
  // is started by an AI coding agent. This repository keeps its agent guidance
  // in CLAUDE.md, so the generated file is switched off.
  agentRules: false,
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

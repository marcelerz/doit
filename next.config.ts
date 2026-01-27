import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
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

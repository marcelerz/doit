import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  reactStrictMode: true,
  basePath: "/doit",
  assetPrefix: "/doit/",
  images: {
    unoptimized: true,
  },
  output: "export", // Enable static HTML export for GitHub Pages
};

export default nextConfig;

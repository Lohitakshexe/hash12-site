import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.GITHUB_ACTIONS ? "export" : undefined,
  basePath: process.env.GITHUB_ACTIONS ? "/hash12-site" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/video-grabber",
  assetPrefix: "/video-grabber",
  turbopack: {},
};

export default nextConfig;


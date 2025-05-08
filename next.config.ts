import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverSourceMaps: true,
    useCache: true,
  },
};

export default nextConfig;

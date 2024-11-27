import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    if (isServer) {
      config.devtool = "source-map";
    }
    return config;
  },
  experimental: {
    serverSourceMaps: true,
  },
};

export default nextConfig;

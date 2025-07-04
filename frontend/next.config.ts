import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable hot reloading in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
  // Add transpilePackages to fix lucide-react compatibility with React 19
  transpilePackages: ["lucide-react"],
  // Allow external host connections (needed for Docker)
  experimental: {
    esmExternals: false,
  },
};

export default nextConfig;

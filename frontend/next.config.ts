// next.config.ts — DOCKER-FRIENDLY VERSION
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // In Docker: use the container name!
        destination: `${
  process.env.NODE_ENV === "development" && !process.env.DOCKER
    ? "http://localhost:8000"
    : "http://hms_backend:8000"
}/api/:path*`,
      },
      {
        source: "/sanctum/csrf-cookie",
              destination: `${
  process.env.NODE_ENV === "development" && !process.env.DOCKER
    ? "http://localhost:8000"
    : "http://hms_backend:8000"
}/sanctum/csrf-cookie`,
      },
      {
        source: "/storage/:path*",
             destination: `${
  process.env.NODE_ENV === "development" && !process.env.DOCKER
    ? "http://localhost:8000"
    : "http://hms_backend:8000"
}/storage/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "hms_backend",
        port: "8000",
        pathname: "/storage/**",
      },
      // Also allow localhost for local dev
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },

  transpilePackages: ["lucide-react"],

  experimental: {
    esmExternals: false,
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
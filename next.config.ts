import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "localhost:3000", "127.0.0.1:3000"],
  turbopack: {
    resolveAlias: {
      canvas: { browser: "empty" },
      encoding: { browser: "empty" },
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@akjol/db", "@akjol/logger", "@akjol/shared", "@akjol/ui"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;

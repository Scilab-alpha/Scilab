import type { NextConfig } from "next";
import { join } from "node:path";

const monorepoRoot = join(process.cwd(), "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "../..");

/** Upstream API for same-origin proxy (avoids browser CORS). */
const scilabApiOrigin = (
  process.env.SCILAB_API_ORIGIN || "https://scilab-api.epsilon.io.vn"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${scilabApiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;

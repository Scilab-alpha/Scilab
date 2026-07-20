export type ApiDataSource = "public" | "local";

/** Deployed Scilab API (epsilon). */
export const PUBLIC_API_ORIGIN = "https://scilab-api.epsilon.io.vn";

/**
 * Local Nest API (Docker Compose / `pnpm --filter api start:dev`).
 * Compose exposes the API on 6003; override with NEXT_PUBLIC_LOCAL_API_URL.
 */
export const LOCAL_API_ORIGIN = "http://localhost:6003";

export function resolveApiDataSource(
  value = process.env.NEXT_PUBLIC_API_DATA_SOURCE,
): ApiDataSource {
  return value?.trim().toLowerCase() === "local" ? "local" : "public";
}

/**
 * Resolve the backend origin used for data + BFF upstream.
 * - Prefer explicit `SCILAB_API_ORIGIN` (server) when provided.
 * - Else follow `NEXT_PUBLIC_API_DATA_SOURCE` (public | local).
 */
export function resolveUpstreamApiOrigin(options?: {
  serverOrigin?: string;
  localOrigin?: string;
  dataSource?: string;
}) {
  const serverOverride = options?.serverOrigin?.trim();
  if (serverOverride) {
    return stripTrailingSlash(serverOverride);
  }

  const source = resolveApiDataSource(
    options?.dataSource ?? process.env.NEXT_PUBLIC_API_DATA_SOURCE,
  );

  if (source === "local") {
    const local =
      options?.localOrigin?.trim() ||
      process.env.NEXT_PUBLIC_LOCAL_API_URL?.trim() ||
      LOCAL_API_ORIGIN;
    return stripTrailingSlash(local);
  }

  return PUBLIC_API_ORIGIN;
}

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

const dataSource = resolveApiDataSource();
const upstreamOrigin = resolveUpstreamApiOrigin();

/** Browser calls this (Next rewrite → upstream); never cross-origin in the client. */
const browserApiBase = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || "/backend"
).replace(/\/$/, "");

export const apiConfig = {
  /** `public` = epsilon; `local` = Docker/local Nest. */
  dataSource,
  /** Upstream origin (auth BFF / server-side). */
  upstreamApiOrigin: upstreamOrigin,
  /** Same-origin path for academic list/detail from the browser. */
  publicApiUrl: browserApiBase,
  /** Same-origin Next BFF for authenticated calls. */
  bffApiUrl: "/api",
  requestTimeoutMs: 15_000,
} as const;

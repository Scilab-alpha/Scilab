import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const ALLOWED_PATHS = new Set([
  "auth/login",
  "auth/register",
  "auth/refresh",
  "auth/me",
  "auth/logout",
  "users/me",
]);

const PROXY_TIMEOUT_MS = 15_000;

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context);
}

async function proxyAuthRequest(request: Request, context: RouteContext) {
  const requestId = randomUUID();
  const { path } = await context.params;
  const proxyPath = path.join("/");

  if (!ALLOWED_PATHS.has(proxyPath)) {
    return proxyError(404, "Auth proxy route not found.", requestId);
  }

  const upstreamBaseUrl = getUpstreamBaseUrl();
  if (!upstreamBaseUrl) {
    return proxyError(
      500,
      "Authentication proxy is not configured.",
      requestId,
    );
  }

  const upstreamUrl = new URL(proxyPath, `${upstreamBaseUrl}/`);
  upstreamUrl.search = new URL(request.url).search;

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers: forwardRequestHeaders(request.headers),
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    headers.set("cache-control", "no-store");
    headers.set("x-auth-proxy-request-id", requestId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("Auth proxy request failed", {
      requestId,
      method: request.method,
      path: proxyPath,
      error: error instanceof Error ? error.message : "Unknown proxy error",
    });

    return proxyError(
      timedOut ? 504 : 502,
      timedOut
        ? "Authentication service timed out."
        : "Authentication service is unavailable.",
      requestId,
    );
  }
}

function getUpstreamBaseUrl() {
  const value = process.env.SCILAB_API_BASE_URL?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function forwardRequestHeaders(source: Headers) {
  const headers = new Headers({ accept: "application/json" });
  const contentType = source.get("content-type");
  const authorization = source.get("authorization");

  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);
  return headers;
}

function proxyError(status: number, message: string, requestId: string) {
  return Response.json(
    {
      success: false,
      message,
      data: { requestId },
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-auth-proxy-request-id": requestId,
      },
    },
  );
}

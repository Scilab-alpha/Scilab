import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const ALLOWED_STATIC_PATHS_BY_METHOD: Readonly<
  Record<string, ReadonlySet<string>>
> = {
  GET: new Set(["auth/me", "users", "users/me"]),
  POST: new Set(["auth/login", "auth/register", "auth/refresh", "auth/logout"]),
  PATCH: new Set(["users/me"]),
  DELETE: new Set(),
};

const UUID_SEGMENT =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const USER_BY_ID_PATH = new RegExp(`^users/${UUID_SEGMENT}$`);
const USER_MUTATION_PATH = new RegExp(
  `^users/${UUID_SEGMENT}(?:/(?:role|status))?$`,
);

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

export async function PATCH(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context);
}

async function proxyAuthRequest(request: Request, context: RouteContext) {
  const requestId = randomUUID();
  const { path } = await context.params;
  const proxyPath = path.join("/");

  if (!isAllowedRequest(request.method, proxyPath)) {
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

function isAllowedRequest(method: string, path: string) {
  if (ALLOWED_STATIC_PATHS_BY_METHOD[method]?.has(path)) {
    return true;
  }

  if (method === "GET" || method === "DELETE") {
    return USER_BY_ID_PATH.test(path);
  }

  return method === "PATCH" && USER_MUTATION_PATH.test(path);
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

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { resolveUpstreamApiOrigin } from "@/core/api/config";
import type { ApiEnvelope } from "@/features/auth/types/auth-api.types";

export const ACCESS_COOKIE_NAME = "scilab_access_token";
export const REFRESH_COOKIE_NAME = "scilab_refresh_token";
export const REMEMBER_COOKIE_NAME = "scilab_remember";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 30 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const UPSTREAM_TIMEOUT_MS = 15_000;
const COOKIE_PATH = "/api";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UpstreamResult<T> {
  ok: boolean;
  status: number;
  envelope: ApiEnvelope<T>;
}

interface RefreshedSession {
  tokens: TokenPair;
  remember: boolean;
}

interface RefreshFailure {
  result: UpstreamResult<unknown>;
}

export interface AuthenticatedResult<T> {
  result: UpstreamResult<T>;
  refreshedSession?: RefreshedSession;
}

class AuthBffError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
    readonly requestId: string,
  ) {
    super(message);
    this.name = "AuthBffError";
  }
}

export function rejectCrossOriginMutation(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin === request.nextUrl.origin) return null;

  return bffErrorResponse(403, "Cross-origin request blocked.", {
    code: "CROSS_ORIGIN_REQUEST_BLOCKED",
  });
}

export async function readJsonBody<T>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AuthBffError(
      400,
      "Request body must be valid JSON.",
      "INVALID_JSON",
      randomUUID(),
    );
  }
}

export async function requestUpstream<T>(
  path: string,
  input: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
    accessToken?: string;
  } = {},
): Promise<UpstreamResult<T>> {
  const requestId = randomUUID();
  const upstreamUrl = new URL(path, `${getUpstreamOrigin()}/`);
  const headers = new Headers({ accept: "application/json" });

  if (input.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (input.accessToken) {
    headers.set("authorization", `Bearer ${input.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(upstreamUrl, {
      method: input.method ?? "GET",
      headers,
      body: input.body === undefined ? undefined : JSON.stringify(input.body),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("Auth BFF upstream request failed", {
      requestId,
      path,
      reason: timedOut ? "timeout" : "network_error",
    });
    throw new AuthBffError(
      timedOut ? 504 : 502,
      timedOut
        ? "Authentication service timed out."
        : "Authentication service is unavailable.",
      timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
      requestId,
    );
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new AuthBffError(
      502,
      "Authentication service returned an unexpected response.",
      "UNEXPECTED_UPSTREAM_RESPONSE",
      requestId,
    );
  }

  if (!isApiEnvelope(envelope)) {
    throw new AuthBffError(
      502,
      "Authentication service returned an unexpected response.",
      "UNEXPECTED_UPSTREAM_RESPONSE",
      requestId,
    );
  }

  return {
    ok: response.ok && envelope.success,
    status: response.status,
    envelope,
  };
}

export async function requestAuthenticated<T>(
  request: NextRequest,
  path: string,
  input: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
  } = {},
): Promise<AuthenticatedResult<T>> {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  let refreshedSession: RefreshedSession | undefined;

  if (!accessToken) {
    const refreshResult = await refreshSession(request);
    if ("result" in refreshResult) {
      return { result: refreshResult.result as UpstreamResult<T> };
    }
    refreshedSession = refreshResult;
  }

  let result = await requestUpstream<T>(path, {
    method: input.method,
    body: input.body,
    accessToken: refreshedSession?.tokens.accessToken ?? accessToken,
  });

  if (result.status === 401 && !refreshedSession) {
    const refreshResult = await refreshSession(request);
    if ("result" in refreshResult) {
      return { result: refreshResult.result as UpstreamResult<T> };
    }
    refreshedSession = refreshResult;
    result = await requestUpstream<T>(path, {
      method: input.method,
      body: input.body,
      accessToken: refreshedSession.tokens.accessToken,
    });
  }

  return { result, refreshedSession };
}

/** Proxy an authenticated browser call to the upstream API and sync cookies. */
export async function proxyAuthenticated(
  request: NextRequest,
  path: string,
  input: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: unknown;
  } = {},
) {
  try {
    const authenticated = await requestAuthenticated(request, path, input);
    const response = upstreamResponse(authenticated.result);
    if (authenticated.result.ok) {
      applyRefreshedCookies(response, authenticated);
    } else if (authenticated.result.status === 401) {
      clearAuthCookies(response);
    }
    return response;
  } catch (error) {
    return handleBffError(error);
  }
}

/**
 * Resolve a Bearer access token from cookies (refreshing when needed).
 * Used by long-lived streams such as SSE `/events`.
 */
export async function resolveSessionAccessToken(request: NextRequest): Promise<{
  accessToken: string;
  refreshedSession?: RefreshedSession;
} | null> {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (accessToken) {
    return { accessToken };
  }

  const refreshResult = await refreshSession(request);
  if ("result" in refreshResult) {
    return null;
  }

  return {
    accessToken: refreshResult.tokens.accessToken,
    refreshedSession: refreshResult,
  };
}

export function getUpstreamApiOrigin() {
  return getUpstreamOrigin();
}

export function upstreamResponse<T>(result: UpstreamResult<T>) {
  return jsonEnvelope(result.envelope, result.status);
}

export function successResponse<T>(data: T, message: string, status = 200) {
  return jsonEnvelope({ success: true, message, data }, status);
}

export function bffErrorResponse(
  status: number,
  message: string,
  data: Record<string, unknown> = {},
) {
  return jsonEnvelope({ success: false, message, data }, status);
}

export function handleBffError(error: unknown) {
  if (error instanceof AuthBffError) {
    return bffErrorResponse(error.status, error.message, {
      code: error.code,
      requestId: error.requestId,
    });
  }

  const requestId = randomUUID();
  console.error("Auth BFF request failed", { requestId });
  return bffErrorResponse(500, "Authentication request failed.", {
    code: "BFF_INTERNAL_ERROR",
    requestId,
  });
}

export function isTokenPair(value: unknown): value is TokenPair {
  if (!value || typeof value !== "object") return false;
  const tokens = value as Partial<TokenPair>;
  return (
    typeof tokens.accessToken === "string" &&
    tokens.accessToken.length > 0 &&
    typeof tokens.refreshToken === "string" &&
    tokens.refreshToken.length > 0
  );
}

export function setAuthCookies(
  response: NextResponse,
  tokens: TokenPair,
  remember: boolean,
) {
  const common = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
  };

  response.cookies.set(ACCESS_COOKIE_NAME, tokens.accessToken, {
    ...common,
    ...(remember ? { maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS } : {}),
  });
  response.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...common,
    ...(remember ? { maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS } : {}),
  });
  response.cookies.set(REMEMBER_COOKIE_NAME, remember ? "1" : "0", {
    ...common,
    ...(remember ? { maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS } : {}),
  });
}

export function clearAuthCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: COOKIE_PATH,
    maxAge: 0,
  };
  response.cookies.set(ACCESS_COOKIE_NAME, "", options);
  response.cookies.set(REFRESH_COOKIE_NAME, "", options);
  response.cookies.set(REMEMBER_COOKIE_NAME, "", options);
}

export function applyRefreshedCookies<T>(
  response: NextResponse,
  authenticated: AuthenticatedResult<T>,
) {
  if (authenticated.refreshedSession) {
    setAuthCookies(
      response,
      authenticated.refreshedSession.tokens,
      authenticated.refreshedSession.remember,
    );
  }
}

async function refreshSession(
  request: NextRequest,
): Promise<RefreshedSession | RefreshFailure> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return {
      result: {
        ok: false,
        status: 401,
        envelope: {
          success: false,
          message: "Authentication required.",
          data: {},
        },
      },
    };
  }

  const result = await requestUpstream<TokenPair>("auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
  if (!result.ok || !isTokenPair(result.envelope.data)) {
    return { result };
  }

  return {
    tokens: result.envelope.data,
    remember: request.cookies.get(REMEMBER_COOKIE_NAME)?.value === "1",
  };
}

function getUpstreamOrigin() {
  try {
    const configured = resolveUpstreamApiOrigin({
      serverOrigin: process.env.SCILAB_API_ORIGIN,
    });
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new AuthBffError(
      500,
      "Authentication service is not configured.",
      "UPSTREAM_NOT_CONFIGURED",
      randomUUID(),
    );
  }
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Partial<ApiEnvelope<unknown>>;
  return (
    typeof envelope.success === "boolean" &&
    typeof envelope.message === "string" &&
    "data" in envelope
  );
}

function jsonEnvelope<T>(envelope: ApiEnvelope<T>, status: number) {
  return NextResponse.json(envelope, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

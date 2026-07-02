import { appConfig } from "@/constants/app-config";

const requestTimeoutMs = 15_000;

let accessTokenGetter: (() => Promise<string | null> | string | null) | null =
  null;
let authRecoveryHandler: (() => Promise<boolean>) | null = null;
let authRecoveryPromise: Promise<boolean> | null = null;

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  authenticated?: boolean;
  body?: unknown;
  path: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiErrorContext = "general" | "login" | "register";

export function getUserFriendlyApiErrorMessage(
  error: unknown,
  context: ApiErrorContext = "general",
) {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }

  if (error.code === "TIMEOUT") {
    return "The request took too long. Please try again.";
  }

  if (error.code === "NETWORK_ERROR") {
    return "Unable to connect. Please check your internet connection and try again.";
  }

  if (context === "login" && error.status === 401) {
    return "The email or password you entered is incorrect.";
  }

  if (context === "login" && error.status === 403) {
    return "This account is currently unable to sign in.";
  }

  if (context === "register" && error.status === 409) {
    return "An account with this email already exists.";
  }

  if (context === "register" && error.status === 400) {
    return "Please check your registration details and try again.";
  }

  if (error.status === 404 || error.status === 405) {
    return "This feature is temporarily unavailable. Please try again later.";
  }

  return "We couldn't complete your request. Please try again.";
}

export function setApiAccessTokenGetter(
  getter: () => Promise<string | null> | string | null,
) {
  accessTokenGetter = getter;
}

export function setApiAuthRecoveryHandler(
  handler: (() => Promise<boolean>) | null,
) {
  authRecoveryHandler = handler;
}

export async function apiRequest<T>({
  authenticated = false,
  body,
  headers,
  path,
  signal,
  ...init
}: ApiRequestOptions): Promise<T> {
  try {
    return await executeApiRequest<T>({
      authenticated,
      body,
      headers,
      init,
      path,
      retriedAfterAuthRecovery: false,
      signal,
    });
  } catch (error) {
    logApiError(error, init.method, path);
    throw error;
  }
}

async function executeApiRequest<T>({
  authenticated,
  body,
  headers,
  init,
  path,
  retriedAfterAuthRecovery,
  signal,
}: {
  authenticated: boolean;
  body?: unknown;
  headers?: HeadersInit;
  init: Omit<RequestInit, "body" | "headers" | "signal">;
  path: string;
  retriedAfterAuthRecovery: boolean;
  signal?: AbortSignal | null;
}): Promise<T> {
  const controller = new AbortController();
  const abortFromSignal = () => controller.abort();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    if (signal?.aborted) {
      controller.abort();
    } else {
      signal?.addEventListener("abort", abortFromSignal, { once: true });
    }

    const requestHeaders = await buildHeaders(
      headers,
      authenticated,
      body !== undefined,
    );
    const response = await fetch(`${appConfig.apiUrl}${normalizePath(path)}`, {
      ...init,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: requestHeaders,
      signal: controller.signal,
    });

    const payload = await parseJson(response);

    if (
      response.status === 401 &&
      authenticated &&
      !retriedAfterAuthRecovery &&
      authRecoveryHandler
    ) {
      const recovered = await recoverAuthentication();

      if (recovered) {
        return executeApiRequest<T>({
          authenticated,
          body,
          headers,
          init,
          path,
          retriedAfterAuthRecovery: true,
          signal,
        });
      }
    }

    if (!response.ok) {
      throw new ApiError(
        getResponseMessage(payload) || "Request could not be completed.",
        response.status,
      );
    }

    if (isApiEnvelope<T>(payload)) {
      if (!payload.success) {
        throw new ApiError(
          payload.message || "Request could not be completed.",
          response.status,
        );
      }

      return payload.data;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out.", 0, "TIMEOUT");
    }

    throw new ApiError("Could not connect to the server.", 0, "NETWORK_ERROR");
  } finally {
    signal?.removeEventListener("abort", abortFromSignal);
    clearTimeout(timeout);
  }
}

async function buildHeaders(
  headers: HeadersInit | undefined,
  authenticated: boolean,
  hasBody: boolean,
) {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (hasBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (authenticated && accessTokenGetter) {
    const token = await accessTokenGetter();

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  return requestHeaders;
}

async function recoverAuthentication() {
  if (!authRecoveryHandler) {
    return false;
  }

  authRecoveryPromise ??= authRecoveryHandler().finally(() => {
    authRecoveryPromise = null;
  });

  return authRecoveryPromise;
}

async function parseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      `Server returned a non-JSON response: ${summarizeResponse(text)}`,
      response.status,
      "INVALID_RESPONSE",
    );
  }
}

function logApiError(error: unknown, method: string | undefined, path: string) {
  const details = {
    code: error instanceof ApiError ? error.code : undefined,
    message: error instanceof Error ? error.message : String(error),
    method: method?.toUpperCase() ?? "GET",
    status: error instanceof ApiError ? error.status : undefined,
    url: `${appConfig.apiUrl}${normalizePath(path)}`,
  };

  console.error("[API] Request failed", details, error);
}

function summarizeResponse(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 200
    ? `${normalized.slice(0, 200)}...`
    : normalized;
}

function getResponseMessage(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return undefined;
}

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    "message" in payload &&
    "data" in payload &&
    typeof payload.success === "boolean"
  );
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

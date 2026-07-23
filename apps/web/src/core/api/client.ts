import { apiConfig } from "@/core/api/config";
import { ApiError } from "@/core/api/errors";
import type { ApiEnvelope, ApiRequestOptions } from "@/core/api/types";

/**
 * Call the Scilab backend and return unwrapped `data`.
 * Backend responses use `{ success, message, data }`.
 */
export async function apiRequest<T>({
  authenticated = false,
  body,
  headers,
  path,
  signal,
  timeoutMs,
  ...init
}: ApiRequestOptions): Promise<T> {
  const controller = new AbortController();
  const abortFromSignal = () => controller.abort();
  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs ?? apiConfig.requestTimeoutMs,
  );

  try {
    if (signal?.aborted) {
      controller.abort();
    } else {
      signal?.addEventListener("abort", abortFromSignal, { once: true });
    }

    const requestHeaders = buildHeaders(headers, body !== undefined);
    const apiUrl = authenticated ? apiConfig.bffApiUrl : apiConfig.publicApiUrl;

    const response = await fetch(`${apiUrl}${normalizePath(path)}`, {
      ...init,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: requestHeaders,
      signal: controller.signal,
    });

    const payload = await parseJson(response);

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

function buildHeaders(headers: HeadersInit | undefined, hasBody: boolean) {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (hasBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  return requestHeaders;
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
      "Server returned an invalid JSON response.",
      response.status,
      "INVALID_RESPONSE",
    );
  }
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

import { appConfig } from "@/constants/app-config";

const requestTimeoutMs = 15_000;

let accessTokenGetter: (() => Promise<string | null> | string | null) | null =
  null;

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

export function setApiAccessTokenGetter(
  getter: () => Promise<string | null> | string | null,
) {
  accessTokenGetter = getter;
}

export async function apiRequest<T>({
  authenticated = false,
  body,
  headers,
  path,
  signal,
  ...init
}: ApiRequestOptions): Promise<T> {
  const controller = new AbortController();
  const abortFromSignal = () => controller.abort();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    if (signal?.aborted) {
      controller.abort();
    } else {
      signal?.addEventListener("abort", abortFromSignal, { once: true });
    }

    const requestHeaders = await buildHeaders(headers, authenticated);
    const response = await fetch(`${appConfig.apiUrl}${normalizePath(path)}`, {
      ...init,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: requestHeaders,
      signal: controller.signal,
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      throw new ApiError(
        getResponseMessage(payload) || "Yêu cầu không thể hoàn tất.",
        response.status,
      );
    }

    if (isApiEnvelope<T>(payload)) {
      if (!payload.success) {
        throw new ApiError(
          payload.message || "Yêu cầu không thể hoàn tất.",
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
      throw new ApiError("Yêu cầu đã hết thời gian chờ.", 0, "TIMEOUT");
    }

    throw new ApiError("Không thể kết nối đến máy chủ.", 0, "NETWORK_ERROR");
  } finally {
    signal?.removeEventListener("abort", abortFromSignal);
    clearTimeout(timeout);
  }
}

async function buildHeaders(
  headers: HeadersInit | undefined,
  authenticated: boolean,
) {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (!requestHeaders.has("Content-Type")) {
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

async function parseJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("Phản hồi từ máy chủ không hợp lệ.", response.status);
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

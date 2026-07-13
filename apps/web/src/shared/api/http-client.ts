import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { AuthApiError } from "@/features/auth/types/auth.types";
import type { ApiEnvelope } from "@/features/auth/types/auth-api.types";
import {
  getAccessToken,
  saveAuthSession,
} from "@/features/auth/api/auth-token-storage";
export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiRequest<TData>(
  config: AxiosRequestConfig,
): Promise<TData> {
  try {
    const response = await httpClient.request<ApiEnvelope<TData>>(config);
    return unwrapEnvelope(response.data);
  } catch (error) {
    throw normalizeHttpError(error);
  }
}

export async function apiRequestWithEnvelope<TData>(
  config: AxiosRequestConfig,
): Promise<ApiEnvelope<TData>> {
  try {
    const response = await httpClient.request<ApiEnvelope<TData>>(config);
    return response.data;
  } catch (error) {
    throw normalizeHttpError(error);
  }
}

export function unwrapEnvelope<TData>(envelope: ApiEnvelope<TData>): TData {
  if (
    !envelope ||
    typeof envelope !== "object" ||
    typeof envelope.success !== "boolean"
  ) {
    throw new AuthApiError({
      code: "UNEXPECTED_RESPONSE",
      message:
        "Authentication service returned an unexpected response. Please try again.",
      retryable: true,
    });
  }

  if (!envelope.success) {
    throw new AuthApiError({
      code: "API_ERROR",
      message: envelope.message || "Request failed.",
    });
  }
  return envelope.data;
}

export function normalizeHttpError(error: unknown): AuthApiError {
  if (error instanceof AuthApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new AuthApiError({
      code: "UNKNOWN_ERROR",
      message: "Something went wrong. Please try again.",
      retryable: true,
    });
  }

  return fromAxiosError(error);
}

function fromAxiosError(
  error: AxiosError<Partial<ApiEnvelope<unknown>>>,
): AuthApiError {
  const status = error.response?.status;
  const message =
    error.response?.data?.message ??
    (error.code === "ECONNABORTED"
      ? "The request timed out. Please try again."
      : "Authentication service is unavailable right now.");

  return new AuthApiError({
    code: status ? `HTTP_${status}` : (error.code ?? "NETWORK_ERROR"),
    message,
    status,
    fieldErrors: getFieldErrors(error.response?.data),
    retryable: !status || status >= 500,
  });
}

function getFieldErrors(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;

  const value = payload as {
    fieldErrors?: unknown;
    errors?: unknown;
    data?: { fieldErrors?: unknown; errors?: unknown };
  };
  const candidate =
    value.fieldErrors ??
    value.errors ??
    value.data?.fieldErrors ??
    value.data?.errors;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(candidate).flatMap(([field, message]) =>
      typeof message === "string" ? [[field, message]] : [],
    ),
  );
}

export function rememberSessionFromResponse<
  TData extends {
    accessToken?: string;
    refreshToken?: string;
  },
>(data: TData) {
  if (data.accessToken) {
    saveAuthSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  }
}

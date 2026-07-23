import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { AuthApiError } from "@/features/auth/types/auth.types";
import type { ApiEnvelope } from "@/features/auth/types/auth-api.types";

export const httpClient = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
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
    code:
      getErrorCode(error.response?.data) ??
      (status ? `HTTP_${status}` : (error.code ?? "NETWORK_ERROR")),
    message,
    status,
    fieldErrors: getFieldErrors(error.response?.data),
    retryable: !status || status >= 500,
  });
}

function getErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const value = payload as { code?: unknown; data?: { code?: unknown } };
  const code = value.code ?? value.data?.code;
  return typeof code === "string" ? code : undefined;
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

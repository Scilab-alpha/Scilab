import {
  create,
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

import { ApiError } from "@/shared/api/api-error";
import type { ApiEnvelope } from "@/shared/api/api-types";
import { env } from "@/shared/config/env";

export const httpClient = create({
  baseURL: env.apiUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(toApiError(error)),
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response: AxiosResponse<ApiEnvelope<T>> =
    await httpClient.request<ApiEnvelope<T>>(config);
  const envelope = response.data;

  if (!envelope.success) {
    throw new ApiError(
      envelope.message || "Yêu cầu không thể hoàn tất.",
      response.status,
    );
  }

  return envelope.data;
}

function toApiError(error: AxiosError) {
  const status = error.response?.status ?? 0;
  const responseData = error.response?.data;
  const responseMessage = isApiEnvelope(responseData)
    ? responseData.message
    : undefined;

  if (status === 0) {
    return new ApiError(
      error.code === "ECONNABORTED"
        ? "Yêu cầu đã hết thời gian chờ."
        : "Không thể kết nối đến máy chủ.",
      0,
      error.code || "NETWORK_ERROR",
    );
  }

  return new ApiError(
    responseMessage || "Yêu cầu không thể hoàn tất.",
    status,
    error.code,
  );
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "message" in value &&
    typeof value.message === "string" &&
    "data" in value
  );
}

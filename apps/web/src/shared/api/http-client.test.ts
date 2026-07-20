import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  apiRequest,
  httpClient,
} from "./http-client";
import {
  AUTH_SESSION_STORAGE_KEY,
  getStoredAuthSession,
  saveAuthSession,
} from "@/features/auth/api/auth-token-storage";

const originalAdapter = httpClient.defaults.adapter;

describe("httpClient token refresh", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    httpClient.defaults.adapter = originalAdapter;
    window.localStorage.clear();
  });

  it("uses one refresh request for concurrent 401 responses and retries once", async () => {
    saveAuthSession({ accessToken: "expired", refreshToken: "refresh-1" });
    let profileRequests = 0;
    let refreshRequests = 0;

    httpClient.defaults.adapter = vi.fn(async (config) => {
      if (config.url === "/auth/refresh") {
        refreshRequests += 1;
        return jsonResponse(config, {
          success: true,
          message: "Refreshed",
          data: { accessToken: "fresh", refreshToken: "refresh-2" },
        });
      }

      profileRequests += 1;
      if (profileRequests <= 2) {
        throw unauthorized(config);
      }

      expect(config.headers.get("Authorization")).toBe("Bearer fresh");
      return jsonResponse(config, {
        success: true,
        message: "OK",
        data: { id: `profile-${profileRequests}` },
      });
    });

    const [first, second] = await Promise.all([
      apiRequest<{ id: string }>({ method: "GET", url: "/users/me" }),
      apiRequest<{ id: string }>({ method: "GET", url: "/users/me" }),
    ]);

    expect(first.id).toMatch(/^profile-/);
    expect(second.id).toMatch(/^profile-/);
    expect(profileRequests).toBe(4);
    expect(refreshRequests).toBe(1);
    expect(getStoredAuthSession()).toEqual({
      accessToken: "fresh",
      refreshToken: "refresh-2",
    });
  });

  it("clears the session and emits expiration when refresh fails", async () => {
    saveAuthSession({ accessToken: "expired", refreshToken: "refresh-1" });
    const expiredListener = vi.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expiredListener, {
      once: true,
    });

    httpClient.defaults.adapter = vi.fn(async (config) => {
      throw unauthorized(config);
    });

    await expect(
      apiRequest({ method: "GET", url: "/users/me" }),
    ).rejects.toMatchObject({ status: 401 });

    expect(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(expiredListener).toHaveBeenCalledTimes(1);
  });

  it("does not attempt token refresh for a rejected login", async () => {
    saveAuthSession({ accessToken: "old", refreshToken: "refresh-1" });
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw unauthorized(config);
    });
    httpClient.defaults.adapter = adapter;

    await expect(
      apiRequest({ method: "POST", url: "/auth/login", data: {} }),
    ).rejects.toMatchObject({ status: 401 });

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(getStoredAuthSession()).toEqual({
      accessToken: "old",
      refreshToken: "refresh-1",
    });
  });
});

function jsonResponse<T>(
  config: InternalAxiosRequestConfig,
  data: T,
): AxiosResponse<T> {
  return {
    config,
    data,
    headers: {},
    status: 200,
    statusText: "OK",
  };
}

function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
    config,
    data: { success: false, message: "Authentication failed", data: {} },
    headers: {},
    status: 401,
    statusText: "Unauthorized",
  });
}

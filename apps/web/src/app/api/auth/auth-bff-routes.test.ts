import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { GET as session } from "@/app/api/auth/session/route";
import { POST as logout } from "@/app/api/auth/logout/route";

const frontendOrigin = "https://swapnet.io.vn";
const mockFetch = vi.fn();

describe("auth BFF routes", () => {
  beforeEach(() => {
    vi.stubEnv("SCILAB_API_ORIGIN", "https://scilab-api.epsilon.io.vn");
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sets persistent HttpOnly cookies without exposing login tokens", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockFetch
      .mockResolvedValueOnce(
        apiResponse(200, {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        }),
      )
      .mockResolvedValueOnce(apiResponse(200, apiUser));

    const response = await login(
      mutationRequest("/api/auth/login", {
        email: "student@example.edu",
        password: "secret",
        rememberMe: true,
      }),
    );
    const body = await response.json();
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(body.data).toEqual(apiUser);
    expect(JSON.stringify(body)).not.toContain("access-token");
    expect(JSON.stringify(body)).not.toContain("refresh-token");
    expect(cookies).toContain("scilab_access_token=access-token");
    expect(cookies).toContain("scilab_refresh_token=refresh-token");
    expect(cookies).toContain("scilab_remember=1");
    expect(cookies).toContain("HttpOnly");
    expect(cookies).toContain("Secure");
    expect(cookies).toContain("SameSite=lax");
    expect(cookies).toContain("Max-Age=2592000");
  });

  it("uses session cookies for registration and reports partial success", async () => {
    mockFetch
      .mockResolvedValueOnce(apiResponse(201, apiUser))
      .mockResolvedValueOnce(
        apiResponse(200, {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        }),
      )
      .mockResolvedValueOnce(apiResponse(200, apiUser));

    const success = await register(
      mutationRequest("/api/auth/register", registrationBody),
    );
    expect(success.status).toBe(200);
    expect(success.headers.get("set-cookie")).not.toContain("Max-Age");

    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(apiResponse(201, apiUser))
      .mockResolvedValueOnce(apiError(401, "Authentication failed"));

    const partial = await register(
      mutationRequest("/api/auth/register", registrationBody),
    );
    await expect(partial.json()).resolves.toMatchObject({
      success: false,
      data: { code: "ACCOUNT_CREATED_SIGN_IN_FAILED" },
    });
  });

  it("rotates cookies and retries the current-user request once", async () => {
    mockFetch
      .mockResolvedValueOnce(apiError(401, "Authentication failed"))
      .mockResolvedValueOnce(
        apiResponse(200, {
          accessToken: "next-access-token",
          refreshToken: "next-refresh-token",
        }),
      )
      .mockResolvedValueOnce(apiResponse(200, apiUser));

    const response = await session(
      new NextRequest(`${frontendOrigin}/api/auth/session`, {
        headers: {
          cookie:
            "scilab_access_token=expired; scilab_refresh_token=refresh-token; scilab_remember=1",
        },
      }),
    );
    const body = await response.json();
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(body.data).toEqual(apiUser);
    expect(cookies).toContain("next-access-token");
    expect(cookies).toContain("next-refresh-token");
    expect(JSON.stringify(body)).not.toContain("next-access-token");
  });

  it("stops after a failed refresh and clears the expired session", async () => {
    mockFetch
      .mockResolvedValueOnce(apiError(401, "Authentication failed"))
      .mockResolvedValueOnce(apiError(401, "Refresh token expired"));

    const response = await session(
      new NextRequest(`${frontendOrigin}/api/auth/session`, {
        headers: {
          cookie:
            "scilab_access_token=expired; scilab_refresh_token=expired-refresh; scilab_remember=1",
        },
      }),
    );
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(cookies).toContain("scilab_access_token=");
    expect(cookies).toContain("Max-Age=0");
  });

  it("blocks cross-origin mutations before contacting the backend", async () => {
    const request = new NextRequest(`${frontendOrigin}/api/auth/login`, {
      method: "POST",
      headers: {
        origin: "https://attacker.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "student@example.edu",
        password: "secret",
        rememberMe: false,
      }),
    });

    const response = await login(request);
    expect(response.status).toBe(403);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("allows localhost and 127.0.0.1 as equivalent origins", async () => {
    mockFetch
      .mockResolvedValueOnce(
        apiResponse(200, {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        }),
      )
      .mockResolvedValueOnce(apiResponse(200, apiUser));

    const response = await login(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://127.0.0.1:3000",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "student@example.edu",
          password: "secret",
          rememberMe: false,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("allows same-origin POSTs that omit the Origin header", async () => {
    mockFetch
      .mockResolvedValueOnce(
        apiResponse(200, {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        }),
      )
      .mockResolvedValueOnce(apiResponse(200, apiUser));

    const response = await login(
      new NextRequest(`${frontendOrigin}/api/auth/login`, {
        method: "POST",
        headers: {
          "sec-fetch-site": "same-origin",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "student@example.edu",
          password: "secret",
          rememberMe: false,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("clears cookies even when upstream logout is unavailable", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"));

    const response = await logout(
      new NextRequest(`${frontendOrigin}/api/auth/logout`, {
        method: "POST",
        headers: {
          origin: frontendOrigin,
          cookie: "scilab_access_token=access-token",
        },
      }),
    );
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(502);
    expect(cookies).toContain("scilab_access_token=");
    expect(cookies).toContain("Max-Age=0");
  });
});

const apiUser = {
  id: "user-1",
  email: "student@example.edu",
  status: "ACTIVE",
  role: "STUDENT",
  firstName: "Test",
  lastName: "Student",
};

const registrationBody = {
  email: "student@example.edu",
  password: "Strong123",
  firstname: "Test",
  lastname: "Student",
  gender: "OTHER",
  dataofbirth: "2001-04-12",
};

function mutationRequest(path: string, body: unknown) {
  return new NextRequest(`${frontendOrigin}${path}`, {
    method: "POST",
    headers: {
      origin: frontendOrigin,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function apiResponse(status: number, data: unknown) {
  return Response.json({ success: true, message: "OK", data }, { status });
}

function apiError(status: number, message: string) {
  return Response.json({ success: false, message, data: {} }, { status });
}

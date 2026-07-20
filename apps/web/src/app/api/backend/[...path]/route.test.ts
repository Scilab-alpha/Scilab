import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PATCH, POST } from "./route";

const upstreamFetch = vi.fn();
const USER_ID = "123e4567-e89b-12d3-a456-426614174000";

function context(path: string) {
  return { params: Promise.resolve({ path: path.split("/") }) };
}

describe("auth backend proxy", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", upstreamFetch);
    vi.stubEnv("SCILAB_API_BASE_URL", "https://api.example.test");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("forwards an allowed registration request and preserves the response", async () => {
    upstreamFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          message: "Created",
          data: { id: "1" },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    const request = new Request(
      "http://localhost:3001/api/backend/auth/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "student@example.edu" }),
      },
    );

    const response = await POST(request, context("auth/register"));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      success: true,
      message: "Created",
    });
    expect(upstreamFetch).toHaveBeenCalledWith(
      new URL("https://api.example.test/auth/register"),
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
  });

  it("forwards bearer authentication to protected endpoints", async () => {
    upstreamFetch.mockResolvedValueOnce(
      Response.json({ success: true, message: "OK", data: {} }),
    );
    const request = new Request("http://localhost:3001/api/backend/auth/me", {
      headers: { authorization: "Bearer access-token" },
    });

    await GET(request, context("auth/me"));

    const init = upstreamFetch.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer access-token",
    );
  });

  it("forwards allowed Users reads with query parameters", async () => {
    upstreamFetch.mockResolvedValueOnce(
      Response.json({ success: true, message: "OK", data: { users: [] } }),
    );
    const request = new Request(
      "http://localhost:3001/api/backend/users?view=admin",
      { headers: { authorization: "Bearer access-token" } },
    );

    await GET(request, context("users"));

    expect(upstreamFetch).toHaveBeenCalledWith(
      new URL("https://api.example.test/users?view=admin"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("forwards allowed Users PATCH operations with their body", async () => {
    upstreamFetch.mockResolvedValueOnce(
      Response.json({ success: true, message: "Updated", data: {} }),
    );
    const request = new Request(
      `http://localhost:3001/api/backend/users/${USER_ID}/role`,
      {
        method: "PATCH",
        headers: {
          authorization: "Bearer access-token",
          "content-type": "application/json",
        },
        body: JSON.stringify({ role: "RESEARCHER" }),
      },
    );

    await PATCH(request, context(`users/${USER_ID}/role`));

    const init = upstreamFetch.mock.calls[0]?.[1] as RequestInit;
    expect(init.method).toBe("PATCH");
    expect(
      JSON.parse(new TextDecoder().decode(init.body as ArrayBuffer)),
    ).toEqual({ role: "RESEARCHER" });
  });

  it("forwards allowed Users DELETE operations", async () => {
    upstreamFetch.mockResolvedValueOnce(
      Response.json({ success: true, message: "Deleted", data: {} }),
    );
    const request = new Request(
      `http://localhost:3001/api/backend/users/${USER_ID}`,
      {
        method: "DELETE",
        headers: { authorization: "Bearer access-token" },
      },
    );

    const response = await DELETE(request, context(`users/${USER_ID}`));

    expect(response.status).toBe(200);
    expect(upstreamFetch).toHaveBeenCalledWith(
      new URL(`https://api.example.test/users/${USER_ID}`),
      expect.objectContaining({
        method: "DELETE",
        body: expect.any(ArrayBuffer),
      }),
    );
  });

  it("blocks valid paths when used with a disallowed method", async () => {
    const response = await POST(
      new Request("http://localhost:3001/api/backend/users/me", {
        method: "POST",
        body: "{}",
      }),
      context("users/me"),
    );

    expect(response.status).toBe(404);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("blocks malformed user identifiers", async () => {
    const response = await GET(
      new Request("http://localhost:3001/api/backend/users/not-a-uuid"),
      context("users/not-a-uuid"),
    );

    expect(response.status).toBe(404);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("blocks paths outside the auth allowlist", async () => {
    const response = await GET(
      new Request("http://localhost:3001/api/backend/admin/users"),
      context("admin/users"),
    );

    expect(response.status).toBe(404);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it("returns a traceable 502 envelope when the backend is unavailable", async () => {
    upstreamFetch.mockRejectedValueOnce(new Error("connect failed"));

    const response = await POST(
      new Request("http://localhost:3001/api/backend/auth/login", {
        method: "POST",
        body: "{}",
      }),
      context("auth/login"),
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toMatchObject({
      success: false,
      message: "Authentication service is unavailable.",
      data: { requestId: expect.any(String) },
    });
  });
});

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mockFetch = vi.fn();

describe("users BFF route", () => {
  beforeEach(() => {
    vi.stubEnv("SCILAB_API_ORIGIN", "https://scilab-api.epsilon.io.vn");
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("forwards an authenticated admin list request to the backend users endpoint", async () => {
    mockFetch.mockResolvedValueOnce(
      Response.json(
        {
          success: true,
          message: "Users retrieved",
          data: { users: [] },
        },
        { status: 200 },
      ),
    );

    const response = await GET(
      new NextRequest("https://scilab.local/api/users", {
        headers: { cookie: "scilab_access_token=admin-token" },
      }),
      { params: Promise.resolve({}) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { users: [] },
    });
    expect(mockFetch).toHaveBeenCalledWith(
      new URL("users", "https://scilab-api.epsilon.io.vn/"),
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers),
      }),
    );
  });
});

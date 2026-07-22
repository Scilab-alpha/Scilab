import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/follows/route";
import { POST } from "@/app/api/follows/toggle/route";
import { PATCH } from "@/app/api/follows/[objectType]/[objectId]/route";
import {
  proxyAuthenticated,
  rejectCrossOriginMutation,
} from "@/features/auth/server/auth-bff";

vi.mock("@/features/auth/server/auth-bff", () => ({
  handleBffError: vi.fn(() => Response.json({}, { status: 500 })),
  proxyAuthenticated: vi.fn(() => Response.json({ success: true })),
  readJsonBody: vi.fn(async (request: NextRequest) => request.json()),
  rejectCrossOriginMutation: vi.fn(() => null),
}));

const origin = "https://web.example";

describe("follow BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the list query unchanged", async () => {
    const request = new NextRequest(
      `${origin}/api/follows?type=AUTHOR&page=2&limit=20`,
    );
    await GET(request);
    expect(proxyAuthenticated).toHaveBeenCalledWith(
      request,
      "follows?type=AUTHOR&page=2&limit=20",
    );
  });

  it("forwards toggle and encoded notify-mode PATCH", async () => {
    const toggleRequest = mutationRequest("/api/follows/toggle", {
      objectType: "TOPIC",
      objectId: "T1",
      notifyMode: "IN_APP",
    });
    await POST(toggleRequest);
    expect(proxyAuthenticated).toHaveBeenNthCalledWith(
      1,
      toggleRequest,
      "follows/toggle",
      {
        method: "POST",
        body: { objectType: "TOPIC", objectId: "T1", notifyMode: "IN_APP" },
      },
    );

    const patchRequest = mutationRequest(
      "/api/follows/TOPIC/topic%2Fid",
      { notifyMode: "DAILY_EMAIL" },
      "PATCH",
    );
    await PATCH(patchRequest, {
      params: Promise.resolve({ objectType: "TOPIC", objectId: "topic/id" }),
    });
    expect(proxyAuthenticated).toHaveBeenNthCalledWith(
      2,
      patchRequest,
      "follows/TOPIC/topic%2Fid",
      { method: "PATCH", body: { notifyMode: "DAILY_EMAIL" } },
    );
  });

  it("stops cross-origin mutations before proxying", async () => {
    const blocked = Response.json({}, { status: 403 });
    vi.mocked(rejectCrossOriginMutation).mockReturnValueOnce(blocked as never);
    const request = mutationRequest("/api/follows/toggle", {});
    await expect(POST(request)).resolves.toBe(blocked);
    expect(proxyAuthenticated).not.toHaveBeenCalled();
  });
});

function mutationRequest(
  path: string,
  body: unknown,
  method: "POST" | "PATCH" = "POST",
) {
  return new NextRequest(`${origin}${path}`, {
    method,
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

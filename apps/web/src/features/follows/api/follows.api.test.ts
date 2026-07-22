import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/core/api";
import {
  buildFollowQuery,
  listFollows,
  toggleFollow,
  updateFollowNotifyMode,
} from "./follows.api";

vi.mock("@/core/api", () => ({ apiRequest: vi.fn() }));

describe("follows.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the backend type query parameter", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [],
      page: 2,
      limit: 20,
      hasMore: false,
    });

    expect(buildFollowQuery({ type: "JOURNAL", page: 2, limit: 20 })).toBe(
      "page=2&limit=20&type=JOURNAL",
    );
    await listFollows({ type: "JOURNAL", page: 2, limit: 20 });

    expect(apiRequest).toHaveBeenCalledWith({
      authenticated: true,
      method: "GET",
      path: "/follows?page=2&limit=20&type=JOURNAL",
    });
  });

  it("propagates list failures instead of returning local data", async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("offline"));
    await expect(listFollows()).rejects.toThrow("offline");
  });

  it("sends exact toggle and notify-mode contracts", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        objectType: "TOPIC",
        objectId: "T1",
        followed: true,
      })
      .mockResolvedValueOnce({
        followId: "follow-1",
        objectType: "TOPIC",
        objectId: "topic/id",
        notifyMode: "WEEKLY_EMAIL",
        followedAt: "2026-07-22T00:00:00.000Z",
      });

    await toggleFollow({
      objectType: "TOPIC",
      objectId: " T1 ",
      notifyMode: "IN_APP",
    });
    await updateFollowNotifyMode("TOPIC", "topic/id", {
      notifyMode: "WEEKLY_EMAIL",
    });

    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      authenticated: true,
      method: "POST",
      path: "/follows/toggle",
      body: { objectType: "TOPIC", objectId: "T1", notifyMode: "IN_APP" },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      authenticated: true,
      method: "PATCH",
      path: "/follows/TOPIC/topic%2Fid",
      body: { notifyMode: "WEEKLY_EMAIL" },
    });
  });
});

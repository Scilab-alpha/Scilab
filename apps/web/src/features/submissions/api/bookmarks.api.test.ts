import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/core/api";
import {
  listAllBookmarks,
  listBookmarks,
  toggleBookmark,
} from "./bookmarks.api";

vi.mock("@/core/api", () => ({ apiRequest: vi.fn() }));

describe("bookmarks.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses only the backend for listing and toggling bookmarks", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        items: [],
        page: 2,
        limit: 20,
        hasMore: false,
      })
      .mockResolvedValueOnce({ articleId: "article-1", bookmarked: true });

    await listBookmarks({ page: 2, limit: 20 });
    await toggleBookmark({ articleId: " article-1 " });

    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      authenticated: true,
      method: "GET",
      path: "/bookmarks?page=2&limit=20",
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      authenticated: true,
      method: "POST",
      path: "/bookmarks",
      body: { articleId: "article-1" },
    });
  });

  it("propagates backend failures", async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("offline"));
    await expect(listBookmarks()).rejects.toThrow("offline");
  });

  it("loads every backend page for an authoritative Saved state", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({
        items: [{ articleId: "a", bookmarkedAt: "time-a", article: {} }],
        page: 1,
        limit: 100,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        items: [{ articleId: "b", bookmarkedAt: "time-b", article: {} }],
        page: 2,
        limit: 100,
        hasMore: false,
      });

    await expect(listAllBookmarks()).resolves.toMatchObject({
      items: [{ articleId: "a" }, { articleId: "b" }],
      hasMore: false,
    });
    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      authenticated: true,
      method: "GET",
      path: "/bookmarks?page=1&limit=100",
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      authenticated: true,
      method: "GET",
      path: "/bookmarks?page=2&limit=100",
    });
  });
});

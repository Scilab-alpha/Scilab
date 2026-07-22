import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/core/api";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notifications.api";

vi.mock("@/core/api", () => ({ apiRequest: vi.fn() }));

describe("notifications.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends every operation directly to the backend", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ items: [], page: 1, limit: 20, hasMore: false })
      .mockResolvedValueOnce({ unreadCount: 2 })
      .mockResolvedValueOnce({ notificationId: "notification/id" })
      .mockResolvedValueOnce({ updatedCount: 2 });

    await listNotifications({ page: 1, limit: 20, isRead: false });
    await getUnreadNotificationCount();
    await markNotificationRead("notification/id");
    await markAllNotificationsRead();

    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      authenticated: true,
      method: "GET",
      path: "/notifications?page=1&limit=20&isRead=false",
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      authenticated: true,
      method: "GET",
      path: "/notifications/unread-count",
    });
    expect(apiRequest).toHaveBeenNthCalledWith(3, {
      authenticated: true,
      method: "PATCH",
      path: "/notifications/notification%2Fid/read",
    });
    expect(apiRequest).toHaveBeenNthCalledWith(4, {
      authenticated: true,
      method: "PATCH",
      path: "/notifications/read-all",
    });
  });

  it("propagates backend failures", async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error("offline"));
    await expect(getUnreadNotificationCount()).rejects.toThrow("offline");
  });
});

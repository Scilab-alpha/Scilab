import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NotificationCenter from "./NotificationCenter";
import { useNotifications } from "../hooks/use-notifications";

vi.mock("../hooks/use-notifications", () => ({ useNotifications: vi.fn() }));

describe("NotificationCenter", () => {
  it("uses backend page parameters for navigation", async () => {
    vi.mocked(useNotifications).mockReturnValue({
      items: [
        {
          notificationId: "notification-1",
          title: "Backend notification",
          message: "Loaded from API",
          relatedObjectType: null,
          relatedObjectId: null,
          isRead: false,
          createdAt: "2026-07-22T00:00:00.000Z",
          readAt: null,
        },
      ],
      page: 1,
      hasMore: true,
      unreadCount: 1,
      isLoading: false,
      error: null,
      reload: vi.fn(),
      markRead: vi.fn(),
      markAllRead: vi.fn(),
    });

    const user = userEvent.setup();
    render(<NotificationCenter />);

    expect(useNotifications).toHaveBeenCalledWith(1, 20);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(useNotifications).toHaveBeenLastCalledWith(2, 20);
  });
});

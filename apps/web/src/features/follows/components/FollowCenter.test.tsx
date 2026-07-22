import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFollows } from "@/features/follows/hooks/use-follows";
import FollowCenter from "./FollowCenter";

vi.mock("@/features/follows/hooks/use-follows", () => ({
  useFollows: vi.fn(),
}));
vi.mock("@/shared/components/layout/StudentTopHeader", () => ({
  default: () => <div data-testid="student-top-header" />,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const toggle = vi.fn();
const updateNotifyMode = vi.fn();
const reload = vi.fn();

describe("FollowCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFollows).mockReturnValue({
      data: { items: [follow], page: 1, limit: 20, hasMore: true },
      items: [follow],
      isLoading: false,
      isFetching: false,
      error: null,
      reload,
      toggle,
      togglePending: false,
      toggleVariables: undefined,
      updateNotifyMode,
      notifyPending: false,
      notifyVariables: undefined,
    } as ReturnType<typeof useFollows>);
  });

  it("filters with the backend type parameter and paginates", async () => {
    const user = userEvent.setup();
    render(<FollowCenter />);
    await user.click(screen.getByRole("button", { name: "Authors" }));
    expect(useFollows).toHaveBeenLastCalledWith({
      type: "AUTHOR",
      page: 1,
      limit: 20,
    });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(useFollows).toHaveBeenLastCalledWith({
      type: "AUTHOR",
      page: 2,
      limit: 20,
    });
  });

  it("updates notification mode and unfollows from the list", async () => {
    const user = userEvent.setup();
    render(<FollowCenter />);
    await user.selectOptions(
      screen.getByLabelText("Notification mode for Nature"),
      "WEEKLY_EMAIL",
    );
    expect(updateNotifyMode).toHaveBeenCalledWith({
      objectType: "JOURNAL",
      objectId: "journal-1",
      notifyMode: "WEEKLY_EMAIL",
    });

    await user.click(screen.getByRole("button", { name: "Unfollow Nature" }));
    expect(toggle).toHaveBeenCalledWith({
      objectType: "JOURNAL",
      objectId: "journal-1",
      notifyMode: "IN_APP",
    });
  });

  it("renders backend errors with retry", async () => {
    vi.mocked(useFollows).mockReturnValue({
      data: undefined,
      items: [],
      isLoading: false,
      isFetching: false,
      error: "Backend unavailable",
      reload,
      toggle,
      togglePending: false,
      toggleVariables: undefined,
      updateNotifyMode,
      notifyPending: false,
      notifyVariables: undefined,
    } as ReturnType<typeof useFollows>);
    const user = userEvent.setup();
    render(<FollowCenter />);
    expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(reload).toHaveBeenCalled();
  });
});

const follow = {
  followId: "follow-1",
  objectType: "JOURNAL" as const,
  objectId: "journal-1",
  notifyMode: "IN_APP" as const,
  followedAt: "2026-07-22T00:00:00.000Z",
  target: {
    type: "JOURNAL" as const,
    id: "journal-1",
    displayName: "Nature",
  },
};

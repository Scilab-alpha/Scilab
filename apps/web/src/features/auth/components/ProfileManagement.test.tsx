import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfileManagement from "./ProfileManagement";
import { createTestAuthUser } from "@/features/auth/testing/auth-test-utils";

const { useQueryMock } = vi.hoisted(() => ({ useQueryMock: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({ useQuery: useQueryMock }));
vi.mock("@/shared/components/layout/StudentTopHeader", () => ({
  default: () => <header>Header</header>,
}));

describe("ProfileManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses /users/me profile data instead of hard-coded account identity", async () => {
    useQueryMock.mockReturnValue({
      data: createTestAuthUser({
        displayName: "Api Student",
        firstName: "Api",
        lastName: "Student",
        gender: "FEMALE",
        dateOfBirth: "2001-04-12T00:00:00.000Z",
      }),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<ProfileManagement />);

    expect(screen.getByRole("heading", { name: "Api Student" })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByDisplayValue("2001-04-12")).toBeVisible(),
    );
    expect((screen.getByLabelText("Gender") as HTMLSelectElement).value).toBe(
      "FEMALE",
    );
  });

  it("shows recovery when the full profile request fails", () => {
    const refetch = vi.fn();
    useQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    });

    render(<ProfileManagement />);

    expect(screen.getByText("We could not load your profile.")).toBeVisible();
    screen.getByRole("button", { name: "Try again" }).click();
    expect(refetch).toHaveBeenCalled();
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/features/auth/types/auth.types";
import type { UserProfile } from "@/features/users/types/user.types";
import ProfileManagement from "./ProfileManagement";

const {
  getMyProfileMock,
  logoutMock,
  refreshCurrentUserMock,
  toastErrorMock,
  toastSuccessMock,
  updateMyProfileMock,
} = vi.hoisted(() => ({
  getMyProfileMock: vi.fn(),
  logoutMock: vi.fn(),
  refreshCurrentUserMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  updateMyProfileMock: vi.fn(),
}));

vi.mock("@/features/users/api/users.api", () => ({
  getMyProfile: getMyProfileMock,
  updateMyProfile: updateMyProfileMock,
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({
    logout: logoutMock,
    refreshCurrentUser: refreshCurrentUserMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

describe("ProfileManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyProfileMock.mockResolvedValue(profile);
    updateMyProfileMock.mockImplementation(async (patch) => ({
      ...profile,
      ...patch,
      displayName:
        patch.firstName || patch.lastName
          ? `${patch.firstName ?? profile.firstName} ${patch.lastName ?? profile.lastName}`
          : profile.displayName,
    }));
    refreshCurrentUserMock.mockResolvedValue(profile);
    logoutMock.mockResolvedValue(undefined);
  });

  it("renders the API profile and only supported account controls", async () => {
    renderProfile();

    expect(
      await screen.findByRole("heading", { name: "Api Student" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveValue("api@scilab.test");
    expect(screen.getByLabelText("First name")).toHaveValue("Api");
    expect(screen.getByLabelText("Last name")).toHaveValue("Student");
    expect(screen.getByLabelText("Gender")).toHaveValue("FEMALE");
    expect(screen.getByLabelText("Date of birth")).toHaveValue("2001-04-12");
    expect(screen.getByText("AS")).toBeVisible();

    expect(screen.queryByText("Change Password")).not.toBeInTheDocument();
    expect(screen.queryByText("Active Sessions")).not.toBeInTheDocument();
    expect(screen.queryByText("Upload Image")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("keeps nullable gender unselected instead of changing it to Other", async () => {
    getMyProfileMock.mockResolvedValueOnce({ ...profile, gender: null });
    renderProfile();

    expect(await screen.findByLabelText("Gender")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("shows a stable skeleton while the profile is loading", () => {
    getMyProfileMock.mockImplementation(() => new Promise(() => undefined));

    renderProfile();

    expect(
      screen.getByRole("status", { name: "Loading your profile" }),
    ).toBeVisible();
  });

  it("recovers from a profile query failure", async () => {
    getMyProfileMock.mockRejectedValueOnce(new Error("offline"));
    const user = renderProfile();

    expect(
      await screen.findByRole("heading", {
        name: "We could not load your profile",
      }),
    ).toBeVisible();

    getMyProfileMock.mockResolvedValueOnce(profile);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("heading", { name: "Api Student" }),
    ).toBeVisible();
  });

  it("PATCHes only dirty fields and refreshes the shell identity", async () => {
    const user = renderProfile();
    const email = await screen.findByLabelText("Email");

    await user.clear(email);
    await user.type(email, "new@scilab.test");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateMyProfileMock).toHaveBeenCalledTimes(1));
    expect(updateMyProfileMock.mock.calls[0]?.[0]).toEqual({
      email: "new@scilab.test",
    });
    expect(refreshCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Profile updated successfully.",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("new@scilab.test");
  });

  it("validates a changed name with Zod before sending the PATCH", async () => {
    const user = renderProfile();
    const firstName = await screen.findByLabelText("First name");

    await user.clear(firstName);
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("First name is required.")).toBeVisible();
    expect(updateMyProfileMock).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Please fix the highlighted fields.",
    );
  });

  it("keeps entered data and maps a conflict to the email field", async () => {
    updateMyProfileMock.mockRejectedValueOnce(
      new AuthApiError({
        code: "HTTP_409",
        message: "Email already exists.",
        status: 409,
      }),
    );
    const user = renderProfile();
    const email = await screen.findByLabelText("Email");

    await user.clear(email);
    await user.type(email, "duplicate@scilab.test");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByText("This email is already in use."),
    ).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveValue("duplicate@scilab.test");
    expect(screen.getByText("Changes were not saved")).toBeVisible();
  });

  it("ends the session when the account profile no longer exists", async () => {
    getMyProfileMock.mockRejectedValueOnce(
      new AuthApiError({
        code: "HTTP_404",
        message: "Profile not found.",
        status: 404,
      }),
    );

    renderProfile();

    expect(
      await screen.findByRole("heading", {
        name: "This profile is no longer available",
      }),
    ).toBeVisible();
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });
});

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ProfileManagement />
    </QueryClientProvider>,
  );

  return userEvent.setup();
}

const profile: UserProfile = {
  id: "user-1",
  email: "api@scilab.test",
  firstName: "Api",
  lastName: "Student",
  displayName: "Api Student",
  initials: "AS",
  imageUrl: null,
  gender: "FEMALE",
  dateOfBirth: "2001-04-12T00:00:00.000Z",
  role: "student",
  status: "active",
};

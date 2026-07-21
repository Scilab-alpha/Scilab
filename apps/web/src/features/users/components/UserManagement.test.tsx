import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError } from "@/features/auth/types/auth.types";
import type { UserProfile } from "@/features/users/types/user.types";
import UserManagement from "./UserManagement";

const {
  deleteUserMock,
  getUserByIdMock,
  listUsersMock,
  pushMock,
  updateUserMock,
  updateUserRoleMock,
  updateUserStatusMock,
} = vi.hoisted(() => ({
  deleteUserMock: vi.fn(),
  getUserByIdMock: vi.fn(),
  listUsersMock: vi.fn(),
  pushMock: vi.fn(),
  updateUserMock: vi.fn(),
  updateUserRoleMock: vi.fn(),
  updateUserStatusMock: vi.fn(),
}));

vi.mock("@/features/users/api/users.api", () => ({
  USER_QUERY_KEYS: {
    list: ["users", "list"],
    detail: (id: string) => ["users", "detail", id],
  },
  deleteUser: deleteUserMock,
  getUserById: getUserByIdMock,
  listUsers: listUsersMock,
  updateUser: updateUserMock,
  updateUserRole: updateUserRoleMock,
  updateUserStatus: updateUserStatusMock,
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: () => ({ user: admin }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/shared/components/layout/AdminShell", () => ({
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <main>
      <h1>{title}</h1>
      {children}
    </main>
  ),
}));

describe("UserManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listUsersMock.mockResolvedValue([admin, student]);
    getUserByIdMock.mockImplementation(async (id: string) =>
      id === admin.id ? admin : student,
    );
    updateUserMock.mockImplementation(async (_id, patch) => ({
      ...student,
      ...patch,
      displayName:
        patch.firstName || patch.lastName
          ? String(patch.firstName ?? student.firstName) +
            " " +
            String(patch.lastName ?? student.lastName)
          : student.displayName,
    }));
  });

  it("renders only Swagger-backed columns and filters the real user list", async () => {
    const user = renderManagement();

    expect(await screen.findByRole("table", { name: "Users" })).toBeVisible();
    expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Student User").length).toBeGreaterThan(0);
    expect(screen.queryByText("Registration Date")).not.toBeInTheDocument();
    expect(screen.queryByText("Last Login")).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Filter by status" }),
      "banned",
    );

    expect(screen.queryByText("Student User")).not.toBeInTheDocument();
    expect(screen.getAllByText("Admin User").length).toBeGreaterThan(0);
  });

  it("protects the signed-in admin from destructive account actions", async () => {
    const user = renderManagement();
    await screen.findAllByText("Admin User");

    await user.click(
      screen.getAllByRole("button", { name: "Actions for Admin User" })[0],
    );

    expect(
      await screen.findByRole("menuitem", { name: "Open my profile" }),
    ).toBeVisible();
    expect(
      screen.getByRole("menuitem", { name: "Delete user" }),
    ).toHaveAttribute("data-disabled");
  });

  it("loads user detail and PATCHes only edited profile values", async () => {
    const user = renderManagement();
    await screen.findAllByText("Student User");

    await user.click(
      screen.getAllByRole("button", { name: "Actions for Student User" })[0],
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Edit profile" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Edit user profile",
    });
    expect(getUserByIdMock).toHaveBeenCalledWith(student.id);

    const firstName = within(dialog).getByLabelText("First name");
    await user.clear(firstName);
    await user.type(firstName, "Updated");
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith(student.id, {
        firstName: "Updated",
      }),
    );
  });

  it("allows an email-only PATCH when optional user fields are null", async () => {
    const incompleteUser: UserProfile = {
      ...student,
      firstName: null,
      lastName: null,
      gender: null,
      displayName: "Student",
      initials: "S",
    };
    listUsersMock.mockResolvedValue([admin, incompleteUser]);
    getUserByIdMock.mockResolvedValue(incompleteUser);

    const user = renderManagement();
    const actionButtons = await screen.findAllByRole("button", {
      name: "Actions for Student",
    });
    await user.click(actionButtons[0]);
    await user.click(
      await screen.findByRole("menuitem", { name: "Edit profile" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Edit user profile",
    });
    expect(within(dialog).getByLabelText("Gender")).toHaveValue("");
    const email = within(dialog).getByLabelText("Email");
    await user.clear(email);
    await user.type(email, "renamed@scilab.test");
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(updateUserMock).toHaveBeenCalledWith(incompleteUser.id, {
        email: "renamed@scilab.test",
      }),
    );
  });

  it("closes the edit dialog and refreshes the list when the user is gone", async () => {
    updateUserMock.mockRejectedValueOnce(
      new AuthApiError({
        code: "HTTP_404",
        message: "User not found.",
        status: 404,
      }),
    );
    const user = renderManagement();
    await screen.findAllByText("Student User");

    await user.click(
      screen.getAllByRole("button", { name: "Actions for Student User" })[0],
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Edit profile" }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Edit user profile",
    });
    await user.clear(within(dialog).getByLabelText("First name"));
    await user.type(within(dialog).getByLabelText("First name"), "Missing");
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Edit user profile" }),
      ).not.toBeInTheDocument(),
    );
    expect(listUsersMock).toHaveBeenCalledTimes(2);
  });
});

function renderManagement() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <UserManagement />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

const admin: UserProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "admin@example.edu",
  firstName: "Admin",
  lastName: "User",
  displayName: "Admin User",
  initials: "AU",
  imageUrl: null,
  gender: "OTHER",
  dateOfBirth: "1990-01-01T00:00:00.000Z",
  role: "admin",
  status: "banned",
};

const student: UserProfile = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "student@example.edu",
  firstName: "Student",
  lastName: "User",
  displayName: "Student User",
  initials: "SU",
  imageUrl: null,
  gender: "FEMALE",
  dateOfBirth: "2001-04-12T00:00:00.000Z",
  role: "student",
  status: "active",
};

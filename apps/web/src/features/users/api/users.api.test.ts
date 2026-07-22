import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/shared/api/http-client";
import {
  deleteUser,
  getMyProfile,
  getUserById,
  listUsers,
  updateMyProfile,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from "./users.api";

vi.mock("@/shared/api/http-client", () => ({
  apiRequest: vi.fn(),
}));

const apiUser = {
  id: "user-1",
  email: "jane@example.edu",
  status: "ACTIVE" as const,
  role: "STUDENT" as const,
  firstName: "Jane",
  lastName: "Smith",
  imageUrl: null,
  gender: "FEMALE" as const,
  dateOfBirth: "2001-04-12T00:00:00.000Z",
};

describe("users.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and updates the current profile", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(apiUser)
      .mockResolvedValueOnce({ ...apiUser, firstName: "Janet" });

    await expect(getMyProfile()).resolves.toMatchObject({
      id: "user-1",
      role: "student",
    });
    await expect(
      updateMyProfile({ firstName: " Janet " }),
    ).resolves.toMatchObject({ firstName: "Janet" });

    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      method: "GET",
      url: "/users/me",
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      method: "PATCH",
      url: "/users/me",
      data: { firstname: "Janet" },
    });
  });

  it("unwraps and maps the user list", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({ users: [apiUser] });

    await expect(listUsers()).resolves.toEqual([
      expect.objectContaining({
        id: "user-1",
        displayName: "Jane Smith",
        status: "active",
      }),
    ]);
    expect(apiRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/users",
    });
  });

  it("uses encoded identifiers for admin profile operations", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(apiUser)
      .mockResolvedValueOnce(apiUser);

    await getUserById("user/id");
    await updateUser("user/id", { lastName: " Jones " });

    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      method: "GET",
      url: "/users/user%2Fid",
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      method: "PATCH",
      url: "/users/user%2Fid",
      data: { lastname: "Jones" },
    });
  });

  it("maps role and status mutations to uppercase API enums", async () => {
    vi.mocked(apiRequest)
      .mockResolvedValueOnce({ ...apiUser, role: "RESEARCHER" })
      .mockResolvedValueOnce({ ...apiUser, status: "BANNED" });

    await updateUserRole("user-1", "researcher");
    await updateUserStatus("user-1", "banned");

    expect(apiRequest).toHaveBeenNthCalledWith(1, {
      method: "PATCH",
      url: "/users/user-1/role",
      data: { role: "RESEARCHER" },
    });
    expect(apiRequest).toHaveBeenNthCalledWith(2, {
      method: "PATCH",
      url: "/users/user-1/status",
      data: { status: "BANNED" },
    });
  });

  it("deletes a user only through the API", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({});

    await expect(deleteUser("user-1")).resolves.toBeUndefined();
    expect(apiRequest).toHaveBeenCalledWith({
      method: "DELETE",
      url: "/users/user-1",
    });
  });
});

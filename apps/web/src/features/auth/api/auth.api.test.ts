import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  login,
  toRegisterApiRequest,
  getGoogleOAuthAvailability,
  getUserProfile,
} from "./auth.api";
import { apiRequest } from "@/shared/api/http-client";

vi.mock("@/shared/api/http-client", () => ({
  apiRequest: vi.fn(),
}));

describe("auth.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in through the BFF and returns the authenticated user", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.edu",
      role: "STUDENT",
      status: "ACTIVE",
    });

    const user = await login({
      email: " USER@Example.edu ",
      password: "secret",
      rememberMe: true,
    });

    expect(apiRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/auth/login",
      data: {
        email: "user@example.edu",
        password: "secret",
        rememberMe: true,
      },
    });
    expect(user).toMatchObject({
      id: "user-1",
      email: "user@example.edu",
      role: "student",
    });
  });

  it("maps registration form values to the backend contract", () => {
    expect(
      toRegisterApiRequest({
        email: " Student@Example.edu ",
        firstName: " Jane ",
        lastName: " Smith ",
        gender: "FEMALE",
        dateOfBirth: "2001-04-12",
        password: "Strong123",
        confirmPassword: "Strong123",
      }),
    ).toEqual({
      email: "student@example.edu",
      firstname: "Jane",
      lastname: "Smith",
      gender: "FEMALE",
      dataofbirth: "2001-04-12",
      password: "Strong123",
    });
  });

  it("does not expose a fake Google OAuth success path", async () => {
    await expect(getGoogleOAuthAvailability()).resolves.toEqual({
      available: false,
      message: "Google authentication is not available yet.",
    });
  });

  it("uses the full-profile endpoint only when profile data is requested", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: "user-1",
      email: "student@example.edu",
      status: "ACTIVE",
      role: "STUDENT",
      firstName: "Test",
      lastName: "Student",
      gender: "OTHER",
      dateOfBirth: "2001-04-12T00:00:00.000Z",
    });

    await expect(getUserProfile()).resolves.toMatchObject({
      email: "student@example.edu",
      gender: "OTHER",
      dateOfBirth: "2001-04-12T00:00:00.000Z",
    });
    expect(apiRequest).toHaveBeenCalledWith({
      method: "GET",
      url: "/users/me",
    });
  });
});

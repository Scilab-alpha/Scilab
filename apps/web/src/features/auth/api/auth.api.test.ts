import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  login,
  toRegisterApiRequest,
  getGoogleOAuthAvailability,
  getUserProfile,
} from "./auth.api";
import {
  apiRequest,
  rememberSessionFromResponse,
} from "@/shared/api/http-client";

vi.mock("@/shared/api/http-client", () => ({
  apiRequest: vi.fn(),
  rememberSessionFromResponse: vi.fn(),
}));

describe("auth.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in through the API and remembers the returned session", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      accessToken: "access",
      refreshToken: "refresh",
    });

    const session = await login({
      email: " USER@Example.edu ",
      password: "secret",
    });

    expect(apiRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/auth/login",
      data: {
        email: "user@example.edu",
        password: "secret",
      },
    });
    expect(session).toEqual({
      accessToken: "access",
      refreshToken: "refresh",
    });
    expect(rememberSessionFromResponse).toHaveBeenCalledWith(session);
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

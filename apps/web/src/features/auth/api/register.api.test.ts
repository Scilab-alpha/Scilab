import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerAccount } from "./register.api";
import { getCurrentUser, login, register } from "@/features/auth/api/auth.api";
import {
  createTestAuthSession,
  createTestAuthUser,
} from "@/features/auth/testing/auth-test-utils";
import { AuthApiError } from "@/features/auth/types/auth.types";

vi.mock("@/features/auth/api/auth.api", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

const request = {
  email: "student@example.edu",
  firstName: "Test",
  lastName: "Student",
  gender: "OTHER" as const,
  dateOfBirth: "2001-04-12",
  password: "Strong123",
  confirmPassword: "Strong123",
};

describe("registerAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the account through the API and then creates a real session", async () => {
    const user = createTestAuthUser();
    const session = createTestAuthSession();
    vi.mocked(register).mockResolvedValueOnce(user);
    vi.mocked(login).mockResolvedValueOnce(session);
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user);

    await expect(registerAccount(request)).resolves.toEqual({
      user,
      role: "student",
      session,
    });

    expect(register).toHaveBeenCalledWith(request);
    expect(login).toHaveBeenCalledWith({
      email: request.email,
      password: request.password,
    });
  });

  it("reports that the account exists when automatic sign-in fails", async () => {
    const user = createTestAuthUser();
    vi.mocked(register).mockResolvedValueOnce(user);
    vi.mocked(login).mockRejectedValueOnce(
      new AuthApiError({
        code: "HTTP_401",
        message: "Authentication failed",
        status: 401,
      }),
    );

    const result = registerAccount(request);
    await expect(result).rejects.toMatchObject({
      code: "ACCOUNT_CREATED_SIGN_IN_FAILED",
      status: 401,
      retryable: true,
    });
  });
});

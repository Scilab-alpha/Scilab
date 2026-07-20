import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import RegisterScreen from "./RegisterScreen";
import { registerAccount } from "@/features/auth/api/register.api";
import { useAuth } from "@/providers/auth-provider";
import {
  createTestAuthSession,
  createTestAuthUser,
} from "@/features/auth/testing/auth-test-utils";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/features/auth/api/register.api", () => ({
  registerAccount: vi.fn(),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: vi.fn(),
}));

describe("RegisterScreen", () => {
  const registerSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      status: "anonymous",
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      registerSession,
      refreshCurrentUser: vi.fn(),
      logout: vi.fn(),
      can: vi.fn(),
    });
  });

  it("registers through the API and creates an API-backed session", async () => {
    const session = createTestAuthSession();
    vi.mocked(registerAccount).mockResolvedValueOnce({
      user: createTestAuthUser(),
      role: "student",
      session,
    });

    render(<RegisterScreen />);

    await userEvent.type(screen.getByLabelText("Email"), "student@example.edu");
    await userEvent.type(screen.getByLabelText("First name"), "Test");
    await userEvent.type(screen.getByLabelText("Last name"), "Student");
    await userEvent.type(screen.getByLabelText("Date of birth"), "2001-04-12");
    await userEvent.type(screen.getByLabelText("Password"), "Strong123");
    await userEvent.type(
      screen.getByLabelText("Confirm password"),
      "Strong123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create account" }),
    );

    await waitFor(() => expect(registerSession).toHaveBeenCalledWith(session));
    expect(toast.success).toHaveBeenCalledWith("ScholarTrend account created.");
  }, 15_000);

  it("does not create a fixture session for Google registration", async () => {
    render(<RegisterScreen />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(registerAccount).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      "Google registration is not available yet.",
    );
  });
});

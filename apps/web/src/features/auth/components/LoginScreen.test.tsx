import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import LoginScreen from "./LoginScreen";
import { useAuth } from "@/providers/auth-provider";
import { createTestAuthUser } from "@/features/auth/testing/auth-test-utils";

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

vi.mock("@/providers/auth-provider", () => ({
  useAuth: vi.fn(),
}));

describe("LoginScreen", () => {
  const login = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      status: "anonymous",
      isLoading: false,
      isAuthenticated: false,
      login,
      registerSession: vi.fn(),
      logout: vi.fn(),
      can: vi.fn(),
    });
  });

  it("signs in through the auth context and navigates after API success", async () => {
    login.mockResolvedValueOnce({
      ok: true,
      user: createTestAuthUser(),
      redirectTo: "/student/dashboard",
    });

    render(<LoginScreen />);
    await userEvent.type(screen.getByLabelText("Email"), "student@example.edu");
    await userEvent.type(screen.getByLabelText("Password"), "Strong123");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/student/dashboard"),
    );
    expect(login).toHaveBeenCalledWith("student@example.edu", "Strong123");
  });

  it("shows a safe error after API-backed login failure", async () => {
    login.mockResolvedValueOnce({
      ok: false,
      message: "Authentication failed",
    });

    render(<LoginScreen />);
    await userEvent.type(screen.getByLabelText("Email"), "student@demo.com");
    await userEvent.type(screen.getByLabelText("Password"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Authentication failed"),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("does not create a demo session for Google sign-in", async () => {
    render(<LoginScreen />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(login).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      "Google sign-in is not available yet.",
    );
  });
});

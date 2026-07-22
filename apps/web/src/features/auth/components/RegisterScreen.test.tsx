import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import RegisterScreen from "./RegisterScreen";
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

describe("RegisterScreen", () => {
  const register = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: "anonymous",
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register,
      logout: vi.fn(),
      can: vi.fn(),
    });
  });

  it("registers through the BFF and receives an authenticated user", async () => {
    register.mockResolvedValueOnce(createTestAuthUser());

    render(<RegisterScreen />);
    expect(screen.getAllByText("Scilab").length).toBeGreaterThan(0);

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

    await waitFor(() => expect(register).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith("Scilab account created.");
  }, 10_000);

  it("provides independent password visibility controls", async () => {
    render(<RegisterScreen />);
    const password = screen.getByLabelText("Password");
    const confirmPassword = screen.getByLabelText("Confirm password");
    const showButtons = screen.getAllByRole("button", {
      name: "Show password",
    });

    expect(password).toHaveAttribute("type", "password");
    expect(confirmPassword).toHaveAttribute("type", "password");
    await userEvent.click(showButtons[0]);
    expect(password).toHaveAttribute("type", "text");
    expect(confirmPassword).toHaveAttribute("type", "password");
  });

  it("does not create a fixture session for Google registration", async () => {
    render(<RegisterScreen />);

    await userEvent.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(register).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      "Google registration is not available yet.",
    );
  });
});

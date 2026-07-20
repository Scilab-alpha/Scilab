import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-provider";
import { getCurrentUser, login, logout } from "@/features/auth/api/auth.api";
import { registerAccount } from "@/features/auth/api/register.api";
import { clearLegacyAuthStorage } from "@/features/auth/api/legacy-auth-storage";
import { createTestAuthUser } from "@/features/auth/testing/auth-test-utils";

vi.mock("@/features/auth/api/auth.api", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/features/auth/api/register.api", () => ({
  registerAccount: vi.fn(),
}));

vi.mock("@/features/auth/api/legacy-auth-storage", () => ({
  clearLegacyAuthStorage: vi.fn(),
}));

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="user">{auth.user?.email ?? "none"}</span>
      <button
        onClick={() => void auth.login("student@example.edu", "secret", true)}
      >
        Login
      </button>
      <button
        onClick={() =>
          void auth.register({
            email: "new.student@example.edu",
            firstName: "New",
            lastName: "Student",
            gender: "OTHER",
            dateOfBirth: "2000-01-01",
            password: "secret123",
            confirmPassword: "secret123",
          })
        }
      >
        Register
      </button>
      <button onClick={() => void auth.logout()}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("anonymous"));
  });

  it("restores the current user through the BFF session endpoint", async () => {
    const user = createTestAuthUser();
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent(user.email),
    );
    expect(clearLegacyAuthStorage).toHaveBeenCalled();
  });

  it("creates auth state from the user returned by BFF login", async () => {
    const user = createTestAuthUser();
    vi.mocked(login).mockResolvedValueOnce(user);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("expired"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent(user.email),
    );
    expect(login).toHaveBeenCalledWith({
      email: "student@example.edu",
      password: "secret",
      rememberMe: true,
    });
  });

  it("creates auth state from the user returned by BFF registration", async () => {
    const user = createTestAuthUser({ email: "new.student@example.edu" });
    vi.mocked(registerAccount).mockResolvedValueOnce({
      user,
      role: user.role,
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("expired"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent(user.email),
    );
    expect(registerAccount).toHaveBeenCalledOnce();
  });

  it("always calls the BFF logout endpoint and clears client auth state", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(createTestAuthUser());
    vi.mocked(logout).mockResolvedValue();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(logout).toHaveBeenCalled();
    expect(screen.getByTestId("status")).toHaveTextContent("anonymous");
  });
});

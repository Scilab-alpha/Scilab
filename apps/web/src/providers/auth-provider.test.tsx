import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./auth-provider";
import {
  getCurrentUser,
  login,
  logout,
  refresh,
} from "@/features/auth/api/auth.api";
import {
  clearAuthSession,
  getRefreshToken,
  getStoredAuthSession,
  saveAuthSession,
} from "@/features/auth/api/auth-token-storage";
import {
  createTestAuthSession,
  createTestAuthUser,
} from "@/features/auth/testing/auth-test-utils";
import { AUTH_SESSION_EXPIRED_EVENT } from "@/shared/api/http-client";

vi.mock("@/features/auth/api/auth.api", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/features/auth/api/auth-token-storage", () => ({
  clearAuthSession: vi.fn(),
  getRefreshToken: vi.fn(),
  getStoredAuthSession: vi.fn(),
  saveAuthSession: vi.fn(),
}));

function Probe() {
  const auth = useAuth();
  const [redirect, setRedirect] = React.useState("none");
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="user">{auth.user?.email ?? "none"}</span>
      <span data-testid="redirect">{redirect}</span>
      <button
        onClick={async () => {
          const result = await auth.login("student@example.edu", "secret");
          if (result.ok) setRedirect(result.redirectTo);
        }}
      >
        Login
      </button>
      <button onClick={() => void auth.refreshCurrentUser()}>
        Refresh user
      </button>
      <button onClick={() => void auth.logout()}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getStoredAuthSession).mockReturnValue(null);
  });

  it("creates auth state only after API login success", async () => {
    const session = createTestAuthSession();
    const user = createTestAuthUser();
    vi.mocked(login).mockResolvedValueOnce(session);
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent(user.email),
    );
    expect(saveAuthSession).toHaveBeenCalledWith(session);
  });

  it("redirects admins to the admin overview after login", async () => {
    const session = createTestAuthSession();
    const admin = createTestAuthUser({ role: "admin" });
    vi.mocked(login).mockResolvedValueOnce(session);
    vi.mocked(getCurrentUser).mockResolvedValueOnce(admin);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    await waitFor(() =>
      expect(screen.getByTestId("redirect")).toHaveTextContent("/admin"),
    );
  });

  it("exposes a current-user refresh for profile cache synchronization", async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue(createTestAuthSession());
    vi.mocked(getCurrentUser)
      .mockResolvedValueOnce(createTestAuthUser({ email: "old@example.edu" }))
      .mockResolvedValueOnce(createTestAuthUser({ email: "new@example.edu" }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("old@example.edu"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Refresh user" }));
    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("new@example.edu"),
    );
  });

  it("expires provider state when the HTTP client reports refresh failure", async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue(createTestAuthSession());
    vi.mocked(getCurrentUser).mockResolvedValueOnce(createTestAuthUser());

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    act(() => {
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    });

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("expired"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(clearAuthSession).toHaveBeenCalled();
  });

  it("clears invalid sessions after failed refresh", async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue(createTestAuthSession());
    vi.mocked(getRefreshToken).mockReturnValue("refresh");
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("expired"));
    vi.mocked(refresh).mockRejectedValue(new Error("expired"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(clearAuthSession).toHaveBeenCalled());
    expect(screen.getByTestId("status")).toHaveTextContent("expired");
  });

  it("calls the API on logout when a session exists", async () => {
    vi.mocked(getStoredAuthSession).mockReturnValue(createTestAuthSession());
    vi.mocked(getCurrentUser).mockResolvedValue(createTestAuthUser());
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
    expect(clearAuthSession).toHaveBeenCalled();
  });
});

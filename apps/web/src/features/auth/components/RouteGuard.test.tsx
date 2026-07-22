import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RouteGuard from "./RouteGuard";
import { useAuth } from "@/providers/auth-provider";

const replace = vi.fn();
let pathname = "/student/dashboard";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));

vi.mock("@/providers/auth-provider", () => ({
  useAuth: vi.fn(),
}));

describe("RouteGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pathname = "/student/dashboard";
  });

  it("renders children while API-backed auth is loading so pages can show their own loading UI", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: "loading",
      isLoading: true,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      can: vi.fn(),
    });

    render(
      <RouteGuard>
        <div>Protected</div>
      </RouteGuard>,
    );

    expect(screen.getByText("Protected")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to login", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      status: "anonymous",
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      can: vi.fn(),
    });

    render(
      <RouteGuard>
        <div>Protected</div>
      </RouteGuard>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/auth/login"));
  });
});

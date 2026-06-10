import type { DemoUser } from "@/features/auth/types/auth.types";
import {
  DEMO_ACCOUNTS,
  getPostLoginPath,
} from "@/shared/constants/demo-credentials";

export const AUTH_STORAGE_KEY = "scholartrend_demo_user";

export interface LoginResult {
  ok: true;
  user: DemoUser;
  redirectTo: string;
}

export interface LoginError {
  ok: false;
  message: string;
}

export function getStoredUser(): DemoUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

export function saveUser(user: DemoUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function loginWithCredentials(
  email: string,
  password: string,
): LoginResult | LoginError {
  const normalizedEmail = email.trim().toLowerCase();
  const account = DEMO_ACCOUNTS[normalizedEmail];

  if (!account || account.password !== password) {
    return {
      ok: false,
      message: "Invalid email or password. Use the demo accounts listed below.",
    };
  }

  saveUser(account.user);

  return {
    ok: true,
    user: account.user,
    redirectTo: getPostLoginPath(account.user.role),
  };
}

export function loginAsRegisteredUser(input: {
  email: string;
  displayName: string;
}): DemoUser {
  const user: DemoUser = {
    id: `registered-${Date.now()}`,
    email: input.email.trim().toLowerCase(),
    name: input.displayName.trim() || "New Student",
    role: "student",
    initials: (input.displayName.trim() || "NS")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };

  saveUser(user);
  return user;
}

export function logout(): void {
  clearUser();
}

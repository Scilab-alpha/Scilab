import type { AuthSession } from "@/features/auth/types/auth.types";

export const AUTH_SESSION_STORAGE_KEY = "scholartrend_auth_session";
export const LEGACY_DEMO_USER_STORAGE_KEY = "scholartrend_demo_user";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getStoredAuthSession(): AuthSession | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
  window.localStorage.removeItem(LEGACY_DEMO_USER_STORAGE_KEY);
}

export function clearAuthSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_DEMO_USER_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return getStoredAuthSession()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getStoredAuthSession()?.refreshToken ?? null;
}

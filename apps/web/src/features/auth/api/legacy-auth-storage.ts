const LEGACY_AUTH_KEYS = [
  "scholartrend_auth_session",
  "scholartrend_demo_user",
] as const;

export function clearLegacyAuthStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  for (const key of LEGACY_AUTH_KEYS) {
    window.localStorage.removeItem(key);
  }
}

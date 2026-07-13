import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "@/lib/secure-store";

import type { TokenPair } from "@/features/auth/types";

const sessionKey = "scilab.auth.session";

export async function readStoredSession(): Promise<TokenPair | null> {
  try {
    const value = await getSecureItem(sessionKey);

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as Partial<TokenPair>;

    return typeof parsed.accessToken === "string" &&
      typeof parsed.refreshToken === "string"
      ? { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
      : null;
  } catch {
    return null;
  }
}

export async function writeStoredSession(tokens: TokenPair) {
  await setSecureItem(sessionKey, JSON.stringify(tokens));
}

export async function removeStoredSession() {
  await deleteSecureItem(sessionKey);
}

import { create } from "zustand";

import {
  readStoredSession,
  removeStoredSession,
  writeStoredSession,
} from "@/store/auth-session";
import type { TokenPair } from "@/features/auth/types";
import { setApiAccessTokenGetter } from "@/services/api";

type AuthStatus = "hydrating" | "anonymous" | "authenticated";

type AuthState = {
  accessToken: string | null;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  isAuthenticated: boolean;
  isHydrated: boolean;
  refreshToken: string | null;
  setSession: (tokens: TokenPair, rememberMe: boolean) => Promise<void>;
  status: AuthStatus;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  clearSession: async () => {
    await removeStoredSession();
    set({
      accessToken: null,
      isAuthenticated: false,
      refreshToken: null,
      status: "anonymous",
    });
  },
  hydrate: async () => {
    const session = await readStoredSession();

    set({
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isHydrated: true,
      refreshToken: session?.refreshToken ?? null,
      status: session?.accessToken ? "authenticated" : "anonymous",
    });
  },
  isAuthenticated: false,
  isHydrated: false,
  refreshToken: null,
  setSession: async (tokens, rememberMe) => {
    if (rememberMe) {
      await writeStoredSession(tokens);
    } else {
      await removeStoredSession();
    }

    set({
      ...tokens,
      isAuthenticated: true,
      isHydrated: true,
      status: "authenticated",
    });
  },
  status: "hydrating",
}));

setApiAccessTokenGetter(() => useAuthStore.getState().accessToken);

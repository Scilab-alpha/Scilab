import { create } from "zustand";

import {
  readStoredSession,
  removeStoredSession,
  writeStoredSession,
} from "@/store/auth-session";
import type { CurrentUser, TokenPair } from "@/features/auth/types";
import { setApiAccessTokenGetter } from "@/services/api";

type AuthStatus = "hydrating" | "anonymous" | "authenticated";

type AuthState = {
  accessToken: string | null;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
  isAuthenticated: boolean;
  isHydrated: boolean;
  persistSession: boolean;
  refreshToken: string | null;
  replaceTokens: (tokens: TokenPair) => Promise<void>;
  setSession: (tokens: TokenPair, rememberMe: boolean) => Promise<void>;
  setUser: (user: CurrentUser | null) => void;
  status: AuthStatus;
  user: CurrentUser | null;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  clearSession: async () => {
    await removeStoredSession();
    set({
      accessToken: null,
      isAuthenticated: false,
      persistSession: false,
      refreshToken: null,
      status: "anonymous",
      user: null,
    });
  },
  hydrate: async () => {
    const session = await readStoredSession();

    set({
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.accessToken),
      isHydrated: true,
      persistSession: Boolean(session?.accessToken),
      refreshToken: session?.refreshToken ?? null,
      status: session?.accessToken ? "authenticated" : "anonymous",
      user: null,
    });
  },
  isAuthenticated: false,
  isHydrated: false,
  persistSession: false,
  refreshToken: null,
  replaceTokens: async (tokens) => {
    const persistSession = useAuthStore.getState().persistSession;

    if (persistSession) {
      await writeStoredSession(tokens);
    }

    set({
      ...tokens,
      isAuthenticated: true,
      isHydrated: true,
      status: "authenticated",
    });
  },
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
      persistSession: rememberMe,
      status: "authenticated",
    });
  },
  setUser: (user) => {
    set({ user });
  },
  status: "hydrating",
  user: null,
}));

setApiAccessTokenGetter(() => useAuthStore.getState().accessToken);

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AuthSession,
  AuthStatus,
  AuthUser,
  Permission,
} from "@/features/auth/types/auth.types";
import {
  clearAuthSession,
  getRefreshToken,
  getStoredAuthSession,
  saveAuthSession,
} from "@/features/auth/api/auth-token-storage";
import {
  getCurrentUser,
  login as loginWithApi,
  logout as logoutWithApi,
  refresh as refreshWithApi,
} from "@/features/auth/api/auth.api";
import { hasPermission } from "@/shared/constants/permissions";
import { routes } from "@/shared/constants/routes";

interface LoginResult {
  ok: true;
  user: AuthUser;
  redirectTo: string;
}

interface LoginError {
  ok: false;
  message: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult | LoginError>;
  registerSession: (session?: AuthSession) => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const loadCurrentUser = useCallback(async () => {
    const storedSession = getStoredAuthSession();
    if (!storedSession?.accessToken) {
      clearAuthSession();
      setUser(null);
      setSession(null);
      setStatus("anonymous");
      return null;
    }

    setStatus("loading");
    try {
      setSession(storedSession);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthSession();
        setUser(null);
        setSession(null);
        setStatus("expired");
        return null;
      }

      try {
        setStatus("refreshing");
        const refreshedSession = await refreshWithApi({ refreshToken });
        saveAuthSession(refreshedSession);
        setSession(refreshedSession);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setStatus("authenticated");
        return currentUser;
      } catch {
        clearAuthSession();
        setUser(null);
        setSession(null);
        setStatus("expired");
        return null;
      }
    }
  }, []);

  useEffect(() => {
    globalThis.queueMicrotask(() => {
      void loadCurrentUser();
    });
  }, [loadCurrentUser]);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<LoginResult | LoginError> => {
      setStatus("loading");
      try {
        const nextSession = await loginWithApi({ email, password });
        saveAuthSession(nextSession);
        setSession(nextSession);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setStatus("authenticated");

        return {
          ok: true,
          user: currentUser,
          redirectTo: getPostLoginPath(currentUser.role),
        };
      } catch (error) {
        setStatus("anonymous");
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to sign in. Please try again.",
        };
      }
    },
    [],
  );

  const registerSession = useCallback(
    async (nextSession?: AuthSession) => {
      if (nextSession) {
        saveAuthSession(nextSession);
        setSession(nextSession);
      }
      return loadCurrentUser();
    },
    [loadCurrentUser],
  );

  const logout = useCallback(async () => {
    try {
      if (session?.accessToken) {
        await logoutWithApi();
      }
    } finally {
      clearAuthSession();
      setUser(null);
      setSession(null);
      setStatus("anonymous");
    }
  }, [session]);

  const can = useCallback(
    (permission: Permission) => hasPermission(user?.role, permission),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      session,
      status,
      isLoading: status === "loading" || status === "refreshing",
      isAuthenticated: Boolean(user),
      login,
      registerSession,
      logout,
      can,
    }),
    [user, session, status, login, registerSession, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

function getPostLoginPath(role: AuthUser["role"]) {
  if (role === "admin") return routes.admin.users;
  return routes.student.dashboard;
}

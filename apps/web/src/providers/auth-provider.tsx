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
  AuthStatus,
  AuthUser,
  Permission,
} from "@/features/auth/types/auth.types";
import type { RegisterRequest } from "@/features/auth/types/auth-api.types";
import { clearLegacyAuthStorage } from "@/features/auth/api/legacy-auth-storage";
import {
  getCurrentUser,
  login as loginWithApi,
  logout as logoutWithApi,
} from "@/features/auth/api/auth.api";
import { registerAccount } from "@/features/auth/api/register.api";
import { hasPermission } from "@/shared/constants/permissions";
import { getPostLoginPath } from "@/shared/constants/routes";

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
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<LoginResult | LoginError>;
  register: (request: RegisterRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const loadCurrentUser = useCallback(async () => {
    clearLegacyAuthStorage();
    setStatus("loading");
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
      return currentUser;
    } catch {
      setUser(null);
      setStatus("expired");
      return null;
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
      rememberMe: boolean,
    ): Promise<LoginResult | LoginError> => {
      setStatus("loading");
      try {
        const currentUser = await loginWithApi({
          email,
          password,
          rememberMe,
        });
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

  const register = useCallback(async (request: RegisterRequest) => {
    setStatus("loading");
    try {
      const result = await registerAccount(request);
      setUser(result.user);
      setStatus("authenticated");
      return result.user;
    } catch (error) {
      setUser(null);
      setStatus("anonymous");
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutWithApi();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const can = useCallback(
    (permission: Permission) => hasPermission(user?.role, permission),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === "loading",
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      can,
    }),
    [user, status, login, register, logout, can],
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

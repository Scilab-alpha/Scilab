"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DemoUser } from "@/features/auth/types/auth.types";
import {
  getStoredUser,
  loginAsRegisteredUser,
  loginWithCredentials,
  logout as clearSession,
  type LoginError,
  type LoginResult,
} from "@/features/auth/api/demo-auth";
import { hasPermission } from "@/shared/constants/permissions";
import type { Permission } from "@/features/auth/types/auth.types";

interface AuthContextValue {
  user: DemoUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => LoginResult | LoginError;
  registerSession: (input: { email: string; displayName: string }) => DemoUser;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const result = loginWithCredentials(email, password);
    if (result.ok) {
      setUser(result.user);
    }
    return result;
  }, []);

  const registerSession = useCallback(
    (input: { email: string; displayName: string }) => {
      const nextUser = loginAsRegisteredUser(input);
      setUser(nextUser);
      return nextUser;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: Permission) => hasPermission(user?.role, permission),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      registerSession,
      logout,
      can,
    }),
    [user, isLoading, login, registerSession, logout, can],
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

import { apiRequest } from "@/services/api";

import type {
  CurrentUser,
  LoginCredentials,
  RegisteredUser,
  RegisterPayload,
  TokenPair,
} from "@/features/auth/types";

export function login(credentials: LoginCredentials) {
  return apiRequest<TokenPair>({
    authenticated: false,
    body: credentials,
    method: "POST",
    path: "/auth/login",
  });
}

export function registerStudent(payload: RegisterPayload) {
  return apiRequest<RegisteredUser>({
    authenticated: false,
    body: payload,
    method: "POST",
    path: "/auth/register",
  });
}

export function refreshTokens(refreshToken: string) {
  return apiRequest<TokenPair>({
    authenticated: false,
    body: { refreshToken },
    method: "POST",
    path: "/auth/refresh",
  });
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>({
    authenticated: true,
    method: "GET",
    path: "/auth/me",
  });
}

export function logout() {
  return apiRequest<Record<string, never>>({
    authenticated: true,
    method: "POST",
    path: "/auth/logout",
  });
}

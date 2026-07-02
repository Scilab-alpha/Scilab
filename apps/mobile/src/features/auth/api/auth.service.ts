import { apiRequest } from "@/services/api";

import type { LoginCredentials, TokenPair } from "@/features/auth/types";

export function login(credentials: LoginCredentials) {
  return apiRequest<TokenPair>({
    authenticated: false,
    body: credentials,
    method: "POST",
    path: "/auth/login",
  });
}

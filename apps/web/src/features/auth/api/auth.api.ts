import { apiRequest } from "@/shared/api/http-client";
import type {
  LoginRequest,
  RegisterApiRequest,
  RegisterRequest,
} from "@/features/auth/types/auth-api.types";
import type { AuthUser } from "@/features/auth/types/auth.types";
import { mapApiUser } from "@/features/auth/api/auth-mappers";

export async function login(request: LoginRequest): Promise<AuthUser> {
  const user = await apiRequest<unknown>({
    method: "POST",
    url: "/auth/login",
    data: {
      email: request.email.trim().toLowerCase(),
      password: request.password,
      rememberMe: request.rememberMe,
    },
  });
  return mapApiUser(user as Parameters<typeof mapApiUser>[0]);
}

export async function register(request: RegisterRequest): Promise<AuthUser> {
  const user = await apiRequest<unknown>({
    method: "POST",
    url: "/auth/register",
    data: toRegisterApiRequest(request),
  });
  return mapApiUser(user as Parameters<typeof mapApiUser>[0]);
}

export async function getCurrentUser(): Promise<AuthUser> {
  const user = await apiRequest<unknown>({
    method: "GET",
    url: "/auth/session",
  });
  return mapApiUser(user as Parameters<typeof mapApiUser>[0]);
}

export async function getUserProfile(): Promise<AuthUser> {
  const user = await apiRequest<unknown>({
    method: "GET",
    url: "/users/me",
  });
  return mapApiUser(user as Parameters<typeof mapApiUser>[0]);
}

export async function logout(): Promise<void> {
  await apiRequest<Record<string, never>>({
    method: "POST",
    url: "/auth/logout",
  });
}

export async function getGoogleOAuthAvailability() {
  return {
    available: false,
    message: "Google authentication is not available yet.",
  };
}

export function toRegisterApiRequest(
  request: RegisterRequest,
): RegisterApiRequest {
  return {
    email: request.email.trim().toLowerCase(),
    password: request.password,
    firstname: request.firstName.trim(),
    lastname: request.lastName.trim(),
    gender: request.gender,
    dataofbirth: request.dateOfBirth,
  };
}

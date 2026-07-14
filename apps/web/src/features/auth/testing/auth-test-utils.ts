import type { ApiEnvelope } from "@/features/auth/types/auth-api.types";
import type {
  AuthSession,
  AuthUser,
  UserRole,
} from "@/features/auth/types/auth.types";

export function createApiEnvelope<TData>(
  data: TData,
  message = "OK",
): ApiEnvelope<TData> {
  return {
    success: true,
    message,
    data,
  };
}

export function createTestAuthSession(
  overrides: Partial<AuthSession> = {},
): AuthSession {
  return {
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

export function createTestAuthUser(
  overrides: Partial<AuthUser> = {},
): AuthUser {
  const role: UserRole = overrides.role ?? "student";
  const displayName = overrides.displayName ?? overrides.name ?? "Test Student";

  return {
    id: "test-user-001",
    email: "student@example.edu",
    status: "ACTIVE",
    role,
    firstName: "Test",
    lastName: "Student",
    name: displayName,
    displayName,
    imageUrl: null,
    initials: "TS",
    ...overrides,
  };
}

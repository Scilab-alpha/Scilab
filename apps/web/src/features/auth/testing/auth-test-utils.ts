import type { ApiEnvelope } from "@/features/auth/types/auth-api.types";
import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";

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

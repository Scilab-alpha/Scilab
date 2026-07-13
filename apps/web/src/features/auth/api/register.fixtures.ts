import type {
  RegisterErrorResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/features/auth/types/register.types";

export function createRegisterSuccessFixture(
  request: RegisterRequest,
): RegisterResponse {
  return {
    user: {
      id: "fixture-user-001",
      email: request.email.trim().toLowerCase(),
      status: "ACTIVE",
      role: "student",
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      name: `${request.firstName.trim()} ${request.lastName.trim()}`,
      displayName: `${request.firstName.trim()} ${request.lastName.trim()}`,
      imageUrl: null,
      initials: `${request.firstName[0] ?? ""}${request.lastName[0] ?? ""}`
        .toUpperCase()
        .slice(0, 2),
    },
    role: "student",
    session: {
      accessToken: "fixture-access-token",
      refreshToken: "fixture-refresh-token",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
  };
}

export const duplicateEmailRegisterFixture: RegisterErrorResponse = {
  code: "DUPLICATE_EMAIL",
  message: "An account already exists for this email.",
  fieldErrors: {
    email: "Use another email or sign in to your existing account.",
  },
};

export const weakPasswordRegisterFixture: RegisterErrorResponse = {
  code: "WEAK_PASSWORD",
  message: "Password does not meet the minimum strength requirements.",
  fieldErrors: {
    password: "Use at least 8 characters with letters and a number.",
  },
};

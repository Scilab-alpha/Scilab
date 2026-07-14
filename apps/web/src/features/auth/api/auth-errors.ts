import {
  AuthApiError,
  type AuthFieldErrors,
} from "@/features/auth/types/auth.types";

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthApiError) {
    return error.message;
  }

  return "We could not complete that request. Please try again.";
}

export function getAuthFieldErrors(error: unknown) {
  if (!(error instanceof AuthApiError)) {
    return {};
  }

  if (error.fieldErrors) {
    return error.fieldErrors;
  }

  if (error.status === 409) {
    return {
      email: "Use another email or sign in to your existing account.",
    };
  }

  return {};
}

export function createFieldAuthError(input: {
  code: string;
  message: string;
  fieldErrors: AuthFieldErrors;
}) {
  return new AuthApiError(input);
}

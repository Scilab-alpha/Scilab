import type {
  RegisterErrorResponse,
  RegisterFieldErrors,
} from "@/features/auth/types/register.types";

export class AuthApiError extends Error {
  code: string;
  fieldErrors?: RegisterFieldErrors;

  constructor(error: RegisterErrorResponse) {
    super(error.message);
    this.name = "AuthApiError";
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof AuthApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Registration is unavailable right now. Please try again.";
}

export function getAuthFieldErrors(error: unknown) {
  return error instanceof AuthApiError ? error.fieldErrors ?? {} : {};
}

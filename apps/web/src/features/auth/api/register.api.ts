import type {
  RegisterRequest,
  RegisterResponse,
} from "@/features/auth/types/register.types";
import {
  getCurrentUser,
  login as loginWithApi,
  register as registerWithApi,
} from "@/features/auth/api/auth.api";
import { AuthApiError } from "@/features/auth/types/auth.types";

export async function registerAccount(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  const registeredUser = await registerWithApi(request);
  const session = await loginAfterRegistration(request, registeredUser.email);
  const user = await getCurrentUser().catch(() => registeredUser);

  return {
    user,
    role: user.role,
    session,
  };
}

async function loginAfterRegistration(
  request: RegisterRequest,
  registeredEmail: string,
) {
  try {
    return await loginWithApi({
      email: request.email,
      password: request.password,
    });
  } catch (error) {
    throw new AuthApiError({
      code: "ACCOUNT_CREATED_SIGN_IN_FAILED",
      message: `Your account (${registeredEmail}) was created, but automatic sign-in failed. Please sign in manually.`,
      status: error instanceof AuthApiError ? error.status : undefined,
      retryable: true,
    });
  }
}

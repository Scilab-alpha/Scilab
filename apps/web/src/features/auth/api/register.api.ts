import type {
  RegisterRequest,
  RegisterResponse,
} from "@/features/auth/types/register.types";
import { AuthApiError } from "./auth-errors";
import {
  createRegisterSuccessFixture,
  duplicateEmailRegisterFixture,
  weakPasswordRegisterFixture,
} from "./register.fixtures";

const NETWORK_DELAY_MS = 650;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function registerAccount(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  await wait(NETWORK_DELAY_MS);

  const email = request.email.trim().toLowerCase();

  if (
    email === "existing@ScholarTrend.edu" ||
    email.includes("duplicate") ||
    email.includes("taken")
  ) {
    throw new AuthApiError(duplicateEmailRegisterFixture);
  }

  if (request.password.toLowerCase().includes("password")) {
    throw new AuthApiError(weakPasswordRegisterFixture);
  }

  return createRegisterSuccessFixture({ ...request, email });
}

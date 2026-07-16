import type {
  RegisterRequest,
  RegisterResponse,
} from "@/features/auth/types/register.types";
import { register as registerWithApi } from "@/features/auth/api/auth.api";

export async function registerAccount(
  request: RegisterRequest,
): Promise<RegisterResponse> {
  const user = await registerWithApi(request);

  return {
    user,
    role: user.role,
  };
}

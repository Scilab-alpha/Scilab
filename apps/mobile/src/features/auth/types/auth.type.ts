import type { z } from "zod";

import type { forgotPasswordSchema } from "@/features/auth/schemas/forgot-password.schema";
import type { loginSchema } from "@/features/auth/schemas/login.schema";
import type { registerSchema } from "@/features/auth/schemas/register.schema";

export type LoginFormValues = z.infer<typeof loginSchema>;

export type LoginCredentials = Pick<LoginFormValues, "email" | "password">;

export type RegisterFormValues = z.infer<typeof registerSchema>;

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

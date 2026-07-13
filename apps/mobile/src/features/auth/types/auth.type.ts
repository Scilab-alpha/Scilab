import type { z } from "zod";

import type { forgotPasswordSchema } from "@/features/auth/schemas/forgot-password.schema";
import type { loginSchema } from "@/features/auth/schemas/login.schema";
import type { registerSchema } from "@/features/auth/schemas/register.schema";

export type LoginFormValues = z.infer<typeof loginSchema>;

export type LoginCredentials = Pick<LoginFormValues, "email" | "password">;

export type RegisterFormValues = z.infer<typeof registerSchema>;

export type AuthRole = "ADMIN" | "LECTURER" | "RESEARCHER" | "STUDENT";

export type RegisterPayload = {
  dataofbirth: string;
  email: string;
  firstname: string;
  gender: RegisterFormValues["gender"];
  lastname: string;
  password: string;
};

export type RegisteredUser = {
  dateOfBirth: string | null;
  email: string;
  firstName: string | null;
  gender: RegisterFormValues["gender"] | null;
  id: string;
  lastName: string | null;
  role: AuthRole;
  status: string;
};

export type CurrentUser = Omit<RegisteredUser, "dateOfBirth" | "gender"> & {
  imageUrl: string | null;
};

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

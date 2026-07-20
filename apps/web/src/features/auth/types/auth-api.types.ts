import type { AuthUser, Gender } from "@/features/auth/types/auth.types";

export interface ApiEnvelope<TData> {
  success: boolean;
  message: string;
  data: TData;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string;
}

export interface RegisterApiRequest {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  gender: Gender;
  dataofbirth: string;
}

export type CurrentUserResponse = AuthUser;

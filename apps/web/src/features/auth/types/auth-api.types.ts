import type {
  AuthSession,
  AuthUser,
  Gender,
} from "@/features/auth/types/auth.types";

export interface ApiEnvelope<TData> {
  success: boolean;
  message: string;
  data: TData;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
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

export interface RefreshRequest {
  refreshToken: string;
}

export type CurrentUserResponse = AuthUser;

export interface AuthResult {
  user: AuthUser;
  session: AuthSession;
}

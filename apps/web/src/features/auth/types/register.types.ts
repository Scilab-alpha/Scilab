export type AuthRole = "Lecturer/Student" | "Researcher" | "System Admin";

export type RegisterRequest = {
  email: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
};

export type RegisterResponse = {
  user: import("@/features/auth/types/auth.types").AuthUser;
  role: import("@/features/auth/types/auth.types").UserRole;
  session: import("@/features/auth/types/auth.types").AuthSession;
};

export type RegisterFieldErrors = Partial<
  Record<keyof RegisterRequest, string>
>;

export type RegisterErrorResponse = {
  code: string;
  message: string;
  fieldErrors?: RegisterFieldErrors;
};

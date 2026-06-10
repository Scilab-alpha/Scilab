export type AuthRole = "Lecturer/Student" | "Researcher" | "System Admin";

export type RegisterRequest = {
  email: string;
  displayName: string;
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
  expiresAt: string;
};

export type RegisterResponse = {
  user: AuthUser;
  role: AuthRole;
  session: AuthSession;
};

export type RegisterFieldErrors = Partial<
  Record<keyof RegisterRequest, string>
>;

export type RegisterErrorResponse = {
  code: string;
  message: string;
  fieldErrors?: RegisterFieldErrors;
};

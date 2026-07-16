export type UserRole = "student" | "researcher" | "admin";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface AuthUser {
  id: string;
  email: string;
  status: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  name: string;
  displayName: string;
  imageUrl?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  initials: string;
}

export type AuthStatus = "anonymous" | "loading" | "authenticated" | "expired";

export interface AuthFieldErrors {
  [field: string]: string | undefined;
}

export class AuthApiError extends Error {
  code: string;
  status?: number;
  fieldErrors?: AuthFieldErrors;
  retryable: boolean;

  constructor(input: {
    code: string;
    message: string;
    status?: number;
    fieldErrors?: AuthFieldErrors;
    retryable?: boolean;
  }) {
    super(input.message);
    this.name = "AuthApiError";
    this.code = input.code;
    this.status = input.status;
    this.fieldErrors = input.fieldErrors;
    this.retryable = input.retryable ?? false;
  }
}

export type Permission =
  | "bookmark"
  | "follow"
  | "export_report"
  | "profile"
  | "dashboard"
  | "trends"
  | "notifications"
  | "advanced_dashboard"
  | "admin_panel";

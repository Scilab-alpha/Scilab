export type ApiUserRole = "STUDENT" | "RESEARCHER" | "ADMIN";
export type ApiUserStatus = "ACTIVE" | "INACTIVE" | "BANNED";
export type Gender = "MALE" | "FEMALE" | "OTHER";

export type UserRole = "student" | "researcher" | "admin";
export type UserStatus = "active" | "inactive" | "banned";

export interface ApiUserProfile {
  id: string;
  email: string;
  status: ApiUserStatus;
  role: ApiUserRole;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
}

export interface ApiUserList {
  users: ApiUserProfile[];
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  initials: string;
  imageUrl: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  role: UserRole;
  status: UserStatus;
}

export interface UpdateUserProfileInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  dateOfBirth?: string;
}

export interface ApiUpdateUserProfileInput {
  email?: string;
  firstname?: string;
  lastname?: string;
  gender?: Gender;
  dateofbirth?: string;
}

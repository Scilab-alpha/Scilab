export type AdminUserRole = "admin" | "researcher" | "reader";
export type AdminUserStatus = "active" | "inactive" | "suspended";

/** UI model for admin user management. */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  registrationDate: string;
  lastLogin?: string;
  firstName: string | null;
  lastName: string | null;
}

/** Upstream GET /users item. */
export type ApiUserProfile = {
  id: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "BANNED";
  role: "STUDENT" | "RESEARCHER" | "ADMIN";
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
};

export type ApiUserListResponse = {
  users: ApiUserProfile[];
};

export type PatchableApiRole = "STUDENT" | "RESEARCHER";
export type ApiUserStatus = "ACTIVE" | "INACTIVE" | "BANNED";

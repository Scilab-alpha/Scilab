export type UserRole = "admin" | "researcher" | "reader";
export type UserStatus = "active" | "inactive" | "suspended";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  registrationDate: string;
  lastLogin?: string;
}

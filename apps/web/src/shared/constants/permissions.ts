import type { Permission, UserRole } from "@/features/auth/types/auth.types";

export const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student / Lecturer",
  researcher: "Researcher",
  admin: "System Admin",
};

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    "profile",
    "dashboard",
    "trends",
    "bookmark",
    "follow",
    "notifications",
  ],
  researcher: [
    "profile",
    "dashboard",
    "trends",
    "bookmark",
    "follow",
    "notifications",
    "advanced_dashboard",
    "export_report",
  ],
  admin: ["profile", "admin_panel"],
};

export function hasPermission(
  role: UserRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

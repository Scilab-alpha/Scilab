import type { AuthRole } from "@/features/auth/types";

const roleLabels = {
  ADMIN: "Admin",
  LECTURER: "Lecturer",
  RESEARCHER: "Researcher",
  STUDENT: "Student",
} as const satisfies Record<AuthRole, string>;

const roleSummaries = {
  ADMIN: "System administration, user management, and data operations.",
  LECTURER: "Teaching-focused discovery, bookmarks, and trend exploration.",
  RESEARCHER: "Advanced dashboards, reports, and knowledge graph tools.",
  STUDENT: "Academic search, bookmarks, and personal discovery.",
} as const satisfies Record<AuthRole, string>;

export function getRoleLabel(role?: string | null) {
  return isAuthRole(role) ? roleLabels[role] : "Member";
}

export function getRoleSummary(role?: string | null) {
  return isAuthRole(role)
    ? roleSummaries[role]
    : "General authenticated access.";
}

export function isAuthRole(role?: string | null): role is AuthRole {
  return (
    role === "ADMIN" ||
    role === "LECTURER" ||
    role === "RESEARCHER" ||
    role === "STUDENT"
  );
}

import type { Permission, UserRole } from "@/features/auth/types/auth.types";
import { hasPermission } from "@/shared/constants/permissions";

export interface RouteAccessRule {
  public?: boolean;
  roles?: UserRole[];
  permission?: Permission;
}

const EXACT_ROUTES: Record<string, RouteAccessRule> = {
  "/": { public: true },
  "/auth/login": { public: true },
  "/auth/register": { public: true },
  "/forbidden": { public: true },
  "/student": { public: true },
  "/student/journals": { public: true },
  "/student/articles": { public: true },
  "/student/dashboard": { permission: "dashboard" },
  "/student/advanced": { permission: "advanced_dashboard" },
  "/student/trends": { permission: "trends" },
  "/student/bookmarks": { permission: "bookmark" },
  "/student/notifications": { permission: "notifications" },
  "/student/profile": { permission: "profile" },
};

const PREFIX_ROUTES: { prefix: string; rule: RouteAccessRule }[] = [
  { prefix: "/student/journals/", rule: { public: true } },
  { prefix: "/student/articles/", rule: { public: true } },
  { prefix: "/admin", rule: { roles: ["admin"] } },
];

export function getRouteAccess(pathname: string): RouteAccessRule {
  if (EXACT_ROUTES[pathname]) {
    return EXACT_ROUTES[pathname];
  }

  for (const { prefix, rule } of PREFIX_ROUTES) {
    if (pathname.startsWith(prefix)) {
      return rule;
    }
  }

  return { public: true };
}

export function canAccessRoute(
  pathname: string,
  role: UserRole | null,
): { allowed: boolean; reason?: "login" | "forbidden" } {
  const rule = getRouteAccess(pathname);

  if (rule.public) {
    return { allowed: true };
  }

  if (!role) {
    return { allowed: false, reason: "login" };
  }

  if (rule.roles && !rule.roles.includes(role)) {
    return { allowed: false, reason: "forbidden" };
  }

  if (rule.permission && !hasPermission(role, rule.permission)) {
    return { allowed: false, reason: "forbidden" };
  }

  return { allowed: true };
}

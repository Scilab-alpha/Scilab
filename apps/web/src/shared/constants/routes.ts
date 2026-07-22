import type { UserRole } from "@/features/auth/types/auth.types";

export const routes = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
  forbidden: "/forbidden",
  student: {
    dashboard: "/student/dashboard",
    advanced: "/student/advanced",
    journals: "/student/journals",
    journalDetail: (id: string) => `/student/journals/${id}`,
    articles: "/student/articles",
    articleDetail: (id: string) => `/student/articles/${id}`,
    trends: "/student/trends",
    bookmarks: "/student/bookmarks",
    notifications: "/student/notifications",
    profile: "/student/profile",
  },
  admin: {
    users: "/admin/users",
    apiSources: "/admin/api-sources",
    systemHealth: "/admin/system-health",
  },
} as const;

export function getPostLoginPath(role: UserRole) {
  return role === "admin" ? routes.admin.users : routes.student.dashboard;
}

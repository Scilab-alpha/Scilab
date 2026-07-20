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
    overview: "/admin",
    users: "/admin/users",
    apiSources: "/admin/api-sources",
    systemHealth: "/admin/system-health",
    profile: "/admin/profile",
  },
} as const;

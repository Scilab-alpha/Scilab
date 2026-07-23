import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Bookmark,
  BookOpen,
  FileText,
  LayoutDashboard,
  Trophy,
  // TrendingUp,
  User,
} from "lucide-react";
import type { Permission } from "@/features/auth/types/auth.types";

export interface StudentNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard",
  },
  {
    id: "advanced",
    label: "Advanced Dashboard",
    href: "/student/advanced",
    icon: BarChart3,
    permission: "advanced_dashboard",
  },
  {
    id: "journals",
    label: "Journals",
    href: "/student/journals",
    icon: BookOpen,
  },
  {
    id: "rankings",
    label: "Rankings",
    href: "/student/rankings",
    icon: Trophy,
  },
  {
    id: "articles",
    label: "Articles",
    href: "/student/articles",
    icon: FileText,
  },
  // {
  //   id: "trends",
  //   label: "Trend Analysis",
  //   href: "/student/trends",
  //   icon: TrendingUp,
  //   permission: "trends",
  // },
  {
    id: "bookmarks",
    label: "Bookmarks",
    href: "/student/bookmarks",
    icon: Bookmark,
    permission: "bookmark",
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/student/notifications",
    icon: Bell,
    permission: "notifications",
  },
  {
    id: "profile",
    label: "Profile",
    href: "/student/profile",
    icon: User,
    permission: "profile",
  },
];

export function getStudentNavHref(navId: string): string {
  return (
    STUDENT_NAV_ITEMS.find((item) => item.id === navId)?.href ??
    "/student/dashboard"
  );
}

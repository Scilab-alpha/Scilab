import type { LucideIcon } from "lucide-react";
import { Activity, Database, LayoutDashboard, Users } from "lucide-react";
import { routes } from "@/shared/constants/routes";

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: routes.admin.overview,
    icon: LayoutDashboard,
  },
  {
    id: "users",
    label: "User Management",
    href: routes.admin.users,
    icon: Users,
  },
  {
    id: "api-sources",
    label: "API Sources",
    href: routes.admin.apiSources,
    icon: Database,
  },
  {
    id: "system-health",
    label: "System Health",
    href: routes.admin.systemHealth,
    icon: Activity,
  },
];

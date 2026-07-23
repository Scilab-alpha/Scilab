import type { LucideIcon } from "lucide-react";
import { Activity, Users } from "lucide-react";

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: "users", label: "User Management", href: "/admin/users", icon: Users },
  {
    id: "system-health",
    label: "System Health",
    href: "/admin/system-health",
    icon: Activity,
  },
];

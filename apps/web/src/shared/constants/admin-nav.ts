import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Database,
  FileText,
  Settings,
  Users,
} from "lucide-react";

export interface AdminNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: "users", label: "User Management", href: "/admin/users", icon: Users },
  {
    id: "api-sources",
    label: "API Sources",
    href: "/admin/api-sources",
    icon: Database,
  },
  {
    id: "system-health",
    label: "System Health",
    href: "/admin/system-health",
    icon: Activity,
  },
];

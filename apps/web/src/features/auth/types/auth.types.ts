export type UserRole = "student" | "researcher" | "admin";

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  initials: string;
}

export type Permission =
  | "bookmark"
  | "follow"
  | "export_report"
  | "profile"
  | "dashboard"
  | "trends"
  | "notifications"
  | "advanced_dashboard"
  | "admin_panel";

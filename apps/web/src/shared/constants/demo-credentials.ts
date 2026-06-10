import type { DemoUser, UserRole } from "@/features/auth/types/auth.types";

export const DEMO_PASSWORD = "123456";

export const DEMO_ACCOUNTS: Record<
  string,
  { password: string; user: DemoUser }
> = {
  "student@demo.com": {
    password: DEMO_PASSWORD,
    user: {
      id: "demo-student",
      email: "student@demo.com",
      name: "Alex Student",
      role: "student",
      initials: "AS",
    },
  },
  "researcher@demo.com": {
    password: DEMO_PASSWORD,
    user: {
      id: "demo-researcher",
      email: "researcher@demo.com",
      name: "Dr. Riley Researcher",
      role: "researcher",
      initials: "RR",
    },
  },
  "admin@demo.com": {
    password: DEMO_PASSWORD,
    user: {
      id: "demo-admin",
      email: "admin@demo.com",
      name: "System Admin",
      role: "admin",
      initials: "SA",
    },
  },
};

export const DEMO_CREDENTIAL_HINTS = [
  { role: "Student / Lecturer", email: "student@demo.com", password: DEMO_PASSWORD },
  { role: "Researcher", email: "researcher@demo.com", password: DEMO_PASSWORD },
  { role: "System Admin", email: "admin@demo.com", password: DEMO_PASSWORD },
] as const;

export function getPostLoginPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/users";
    case "researcher":
      return "/student/advanced";
    default:
      return "/student/dashboard";
  }
}

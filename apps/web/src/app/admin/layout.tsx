"use client";

import { usePathname } from "next/navigation";
import AdminShell from "@/shared/components/layout/AdminShell";
import RouteGuard from "@/features/auth/components/RouteGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // If we're on the admin login page, don't render the AdminShell (sidebar).
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminShell>
      <RouteGuard>{children}</RouteGuard>
    </AdminShell>
  );
}

import AdminShell from "@/shared/components/layout/AdminShell";
import RouteGuard from "@/features/auth/components/RouteGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>
      <RouteGuard>{children}</RouteGuard>
    </AdminShell>
  );
}

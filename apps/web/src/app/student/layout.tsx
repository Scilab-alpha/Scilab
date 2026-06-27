import StudentShell from "@/shared/components/layout/StudentShell";
import RouteGuard from "@/features/auth/components/RouteGuard";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <StudentShell>{children}</StudentShell>
    </RouteGuard>
  );
}

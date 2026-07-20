import { UserRound } from "lucide-react";
import ProfileManagement from "@/features/auth/components/ProfileManagement";
import AdminShell from "@/shared/components/layout/AdminShell";

export default function AdminProfilePage() {
  return (
    <AdminShell
      title="My profile"
      subtitle="Review and update your account information"
      icon={<UserRound className="size-5" strokeWidth={1.75} />}
    >
      <ProfileManagement />
    </AdminShell>
  );
}

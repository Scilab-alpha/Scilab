import { UserRound } from "lucide-react";
import ProfileManagement from "@/features/auth/components/ProfileManagement";
import AdminPageFrame from "@/shared/components/layout/AdminPageFrame";

export default function AdminProfilePage() {
  return (
    <AdminPageFrame
      title="My profile"
      subtitle="Review and update your account information"
      icon={<UserRound className="size-5" strokeWidth={1.75} />}
    >
      <ProfileManagement />
    </AdminPageFrame>
  );
}

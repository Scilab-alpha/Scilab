import { Database } from "lucide-react";
import AdminPageFrame from "@/shared/components/layout/AdminPageFrame";
import { FeatureUnavailable } from "@/shared/components/layout/FeatureUnavailable";

export default function ApiSourceConfiguration() {
  return (
    <AdminPageFrame
      title="API Source Configuration"
      subtitle="Backend integration required"
      icon={<Database className="size-5" strokeWidth={1.75} />}
    >
      <FeatureUnavailable
        feature="API Source Configuration"
        description="The backend contract does not provide API source configuration endpoints yet. Source status, connection tests, and configuration actions are disabled until those endpoints are available."
      />
    </AdminPageFrame>
  );
}

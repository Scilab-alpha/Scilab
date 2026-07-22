import ProfileManagement from "@/features/auth/components/ProfileManagement";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";

export default function StudentProfilePage() {
  return (
    <>
      <StudentTopHeader searchPlaceholder="Search articles, journals, topics..." />
      <main className="flex-1 overflow-auto bg-background">
        <PageContainer size="wide" className="py-8 sm:py-12">
          <ProfileManagement />
        </PageContainer>
      </main>
    </>
  );
}

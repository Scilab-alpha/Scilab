import JournalDetail from "@/features/laboratories/components/JournalDetail";

interface StudentJournalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentJournalDetailPage({
  params,
}: StudentJournalDetailPageProps) {
  const { id } = await params;
  return <JournalDetail journalId={id} />;
}

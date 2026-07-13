import { useQuery } from "@tanstack/react-query";

import { getJournalById } from "@/features/academic/api/journal.service";

export function useJournal(journalId: string) {
  return useQuery({
    enabled: Boolean(journalId),
    queryFn: () => getJournalById(journalId),
    queryKey: ["academic", "journal", journalId],
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import { getJournalById } from "@/features/experiments/api/journals.api";

export function useJournalDetail(journalId: string) {
  const query = useQuery({
    queryKey: ["journal", journalId] as const,
    staleTime: listQueryStaleTimeMs,
    enabled: Boolean(journalId),
    queryFn: () => getJournalById(journalId),
  });

  return {
    journal: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
  };
}

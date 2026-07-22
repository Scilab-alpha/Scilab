"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import { listJournalRankings } from "@/features/experiments/api/journals.api";
import type { JournalRankingYear } from "@/features/experiments/types/journal.types";

export const JOURNAL_RANKING_QUERY_KEY = [
  "academic",
  "journal-rankings",
] as const;

export function journalRankingQueryKey(
  year: JournalRankingYear,
  limit: number,
) {
  return [...JOURNAL_RANKING_QUERY_KEY, { year, limit }] as const;
}

export function useJournalRankings(year: JournalRankingYear, limit = 20) {
  const query = useInfiniteQuery({
    queryKey: journalRankingQueryKey(year, limit),
    initialPageParam: undefined as string | undefined,
    staleTime: listQueryStaleTimeMs,
    queryFn: ({ pageParam }) =>
      listJournalRankings({ year, cursor: pageParam, limit }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return {
    pages: query.data?.pages ?? [],
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    loadMore: query.fetchNextPage,
    reload: query.refetch,
  };
}

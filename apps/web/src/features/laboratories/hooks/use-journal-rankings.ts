"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import { listJournalRankings } from "@/features/laboratories/api/journal-rankings.api";
import {
  DEFAULT_JOURNAL_RANKING_YEAR,
  type JournalRankingItem,
} from "@/features/laboratories/types/journal-ranking.types";

const PAGE_LIMIT = 50;

export function useJournalRankings(year = DEFAULT_JOURNAL_RANKING_YEAR) {
  const query = useInfiniteQuery({
    queryKey: ["journal-rankings", year] as const,
    initialPageParam: undefined as string | undefined,
    staleTime: listQueryStaleTimeMs,
    queryFn: async ({ pageParam }) =>
      listJournalRankings({
        year,
        limit: PAGE_LIMIT,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const reload = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const loadMore = useCallback(async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return false;
    }
    try {
      await query.fetchNextPage();
      return true;
    } catch {
      return false;
    }
  }, [query]);

  return {
    items: items as JournalRankingItem[],
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload,
    loadMore,
  };
}

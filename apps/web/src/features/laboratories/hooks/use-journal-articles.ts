"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import {
  academicArticlePageSize,
  listQueryStaleTimeMs,
} from "@/core/api/query-config";
import { listArticles } from "@/features/experiments/api/articles.api";

/** Articles attached to a journal via GET /academic/articles?journalId= */
export function useJournalArticles(journalId: string) {
  const trimmedId = journalId.trim();

  const query = useInfiniteQuery({
    queryKey: ["journal-articles", trimmedId] as const,
    initialPageParam: undefined as string | undefined,
    staleTime: listQueryStaleTimeMs,
    enabled: trimmedId.length > 0,
    queryFn: async ({ pageParam }) =>
      listArticles({
        journalId: trimmedId,
        limit: academicArticlePageSize,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

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
    items,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    loadMore,
  };
}

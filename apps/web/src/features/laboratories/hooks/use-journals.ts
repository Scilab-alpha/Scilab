"use client";

import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import {
  academicListPageSize,
  listQueryStaleTimeMs,
} from "@/core/api/query-config";
import { listJournals } from "@/features/experiments/api/journals.api";

export function useJournals() {
  const query = useInfiniteQuery({
    queryKey: [
      "academic",
      "journals",
      { limit: academicListPageSize },
    ] as const,
    initialPageParam: undefined as string | undefined,
    staleTime: listQueryStaleTimeMs,
    queryFn: async ({ pageParam }) =>
      listJournals({
        limit: academicListPageSize,
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
    items,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload,
    loadMore,
  };
}

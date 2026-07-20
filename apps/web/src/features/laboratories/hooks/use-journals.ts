"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import {
  academicListPageSize,
  listQueryStaleTimeMs,
} from "@/core/api/query-config";
import { listJournals } from "@/features/experiments/api/journals.api";

const searchDebounceMs = 350;

export function useJournals(searchText = "") {
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText);
    }, searchDebounceMs);

    return () => window.clearTimeout(timer);
  }, [searchText]);

  const trimmedQuery = debouncedSearch.trim();

  const query = useInfiniteQuery({
    queryKey: ["journals", trimmedQuery] as const,
    initialPageParam: undefined as string | undefined,
    staleTime: listQueryStaleTimeMs,
    queryFn: async ({ pageParam }) =>
      listJournals({
        q: trimmedQuery || undefined,
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

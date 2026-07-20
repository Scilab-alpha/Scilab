"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import {
  academicListPageSize,
  listQueryStaleTimeMs,
} from "@/core/api/query-config";
import { listArticles } from "@/features/experiments/api/articles.api";
import { syncLocalFollowNotifications } from "@/features/notifications/api/local-notifications";

const searchDebounceMs = 350;

export function useArticles(keyword: string) {
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, searchDebounceMs);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  const trimmedKeyword = debouncedKeyword.trim();
  const queryKey = ["articles", trimmedKeyword] as const;

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined as string | undefined,
    staleTime: listQueryStaleTimeMs,
    queryFn: async ({ pageParam }) => {
      const page = await listArticles({
        keyword: trimmedKeyword || undefined,
        limit: academicListPageSize,
        cursor: pageParam,
      });
      syncLocalFollowNotifications(page.items);
      return page;
    },
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
    /** True on first visit until the API responds (cached revisits stay instant). */
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    error: query.error
      ? getUserFriendlyApiErrorMessage(query.error)
      : null,
    reload,
    loadMore,
  };
}

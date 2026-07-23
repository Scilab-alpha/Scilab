"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import {
  academicArticlePageSize,
  listQueryStaleTimeMs,
} from "@/core/api/query-config";
import { listArticles } from "@/features/experiments/api/articles.api";
import { syncLocalFollowNotifications } from "@/features/notifications/api/local-notifications";
import type {
  ArticleApiFilters,
  ArticleSort,
} from "@/features/experiments/types/article.types";

const searchDebounceMs = 250;

function resolveSort(
  sort: ArticleSort | undefined,
  hasResearchQuery: boolean,
): ArticleSort | undefined {
  if (!sort) {
    return undefined;
  }

  // API requires a research query for `relevant`.
  if (sort === "relevant" && !hasResearchQuery) {
    return "newest";
  }

  return sort;
}

export function useArticles(
  searchText: string,
  apiFilters: ArticleApiFilters = {},
) {
  const [debouncedSearch, setDebouncedSearch] = useState(searchText);
  const [debouncedPublisher, setDebouncedPublisher] = useState(
    apiFilters.publisher ?? "",
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText);
    }, searchDebounceMs);

    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedPublisher(apiFilters.publisher ?? "");
    }, searchDebounceMs);

    return () => window.clearTimeout(timer);
  }, [apiFilters.publisher]);

  const trimmedQuery = debouncedSearch.trim();
  const trimmedPublisher = debouncedPublisher.trim();
  const hasResearchQuery =
    trimmedQuery.length > 0 ||
    Boolean(apiFilters.keywordId?.trim()) ||
    Boolean(apiFilters.topicId?.trim());

  // Default to newest — `relevant` ranking is much slower on the academic API.
  const effectiveSort = hasResearchQuery
    ? resolveSort(apiFilters.sort ?? "newest", true)
    : resolveSort(apiFilters.sort ?? "newest", false);

  const queryKey = [
    "articles",
    trimmedQuery,
    apiFilters.keywordId ?? "",
    apiFilters.topicId ?? "",
    apiFilters.journalId ?? "",
    apiFilters.publicationYear ?? "",
    apiFilters.publicationYearFrom ?? "",
    apiFilters.publicationYearTo ?? "",
    trimmedPublisher,
    apiFilters.country ?? "",
    effectiveSort ?? "",
  ] as const;

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined as string | undefined,
    staleTime: listQueryStaleTimeMs,
    queryFn: async ({ pageParam }) => {
      const page = await listArticles({
        q: trimmedQuery || undefined,
        keywordId: apiFilters.keywordId || undefined,
        topicId: apiFilters.topicId || undefined,
        journalId: apiFilters.journalId || undefined,
        publicationYear: apiFilters.publicationYear || undefined,
        publicationYearFrom: apiFilters.publicationYear
          ? undefined
          : apiFilters.publicationYearFrom || undefined,
        publicationYearTo: apiFilters.publicationYear
          ? undefined
          : apiFilters.publicationYearTo || undefined,
        publisher: trimmedPublisher || undefined,
        country: apiFilters.country || undefined,
        sort: effectiveSort,
        limit: academicArticlePageSize,
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
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload,
    loadMore,
  };
}

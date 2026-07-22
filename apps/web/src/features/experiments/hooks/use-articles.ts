"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import {
  academicListPageSize,
  listQueryStaleTimeMs,
} from "@/core/api/query-config";
import { listArticles } from "@/features/experiments/api/articles.api";
import type { ArticleListParams } from "@/features/experiments/types/article.types";

const searchDebounceMs = 350;

export function useArticles(params: ArticleListParams = {}) {
  const [debouncedSearch, setDebouncedSearch] = useState(params.q ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(params.q ?? "");
    }, searchDebounceMs);

    return () => window.clearTimeout(timer);
  }, [params.q]);

  const trimmedQuery = debouncedSearch.trim();
  const normalizedCountry = params.country?.trim().toUpperCase();
  const keywordId = params.keywordId?.trim() || undefined;
  const topicId = params.topicId?.trim() || undefined;
  const hasResearchQuery = Boolean(trimmedQuery || keywordId || topicId);
  const hasExactYear = typeof params.publicationYear === "number";
  const filters = {
    q: trimmedQuery || undefined,
    keywordId,
    topicId,
    authorId: params.authorId?.trim() || undefined,
    journalId: params.journalId?.trim() || undefined,
    publicationYear: params.publicationYear,
    publicationYearFrom: hasExactYear ? undefined : params.publicationYearFrom,
    publicationYearTo: hasExactYear ? undefined : params.publicationYearTo,
    publisher: params.publisher?.trim() || undefined,
    country:
      normalizedCountry && /^[A-Z]{2}$/.test(normalizedCountry)
        ? normalizedCountry
        : undefined,
    sort:
      params.sort === "relevant" && !hasResearchQuery ? undefined : params.sort,
  };
  const queryKey = ["articles", filters] as const;

  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined as string | undefined,
    staleTime: listQueryStaleTimeMs,
    queryFn: ({ pageParam }) =>
      listArticles({
        ...filters,
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
    /** True on first visit until the API responds (cached revisits stay instant). */
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: Boolean(query.hasNextPage),
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload,
    loadMore,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import { getArticleById } from "@/features/experiments/api/articles.api";

export function useArticleDetail(articleId: string) {
  const query = useQuery({
    queryKey: ["article", articleId] as const,
    staleTime: listQueryStaleTimeMs,
    enabled: Boolean(articleId),
    queryFn: () => getArticleById(articleId),
  });

  return {
    article: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
  };
}

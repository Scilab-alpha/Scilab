import { apiRequest } from "@/services/api";

import type { RelatedArticleGraph } from "@/features/articles/types/article-graph.type";

export function getArticleRelatedGraph(articleId: string, limit = 5) {
  const params = new URLSearchParams({ limit: String(limit) });

  return apiRequest<RelatedArticleGraph>({
    method: "GET",
    path: `/academic/graphs/article/${encodeURIComponent(articleId)}?${params.toString()}`,
  });
}

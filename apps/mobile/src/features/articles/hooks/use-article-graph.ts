import { useQuery } from "@tanstack/react-query";

import { getArticleRelatedGraph } from "@/features/articles/api/article-graph.service";

export function useArticleRelatedGraph(articleId: string, limit = 5) {
  return useQuery({
    enabled: Boolean(articleId),
    queryFn: () => getArticleRelatedGraph(articleId, limit),
    queryKey: ["academic", "article-related-graph", articleId, limit],
  });
}

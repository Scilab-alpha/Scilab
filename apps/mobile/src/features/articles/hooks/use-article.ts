import { useQuery } from "@tanstack/react-query";

import { getArticleById } from "@/features/articles/api/article.service";

export function useArticle(articleId: string) {
  return useQuery({
    enabled: Boolean(articleId),
    queryFn: () => getArticleById(articleId),
    queryKey: ["academic", "article", articleId],
  });
}

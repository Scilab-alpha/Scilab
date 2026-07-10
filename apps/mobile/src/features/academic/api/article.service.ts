import { apiRequest } from "@/services/api";

import type {
  ArticleGraph,
  ArticleListParams,
  CursorPage,
} from "@/features/academic/types/article.type";

const defaultLimit = 20;

export function listArticles({
  cursor,
  keyword,
  limit = defaultLimit,
}: ArticleListParams = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  const trimmedKeyword = keyword?.trim();

  if (cursor) {
    params.set("cursor", cursor);
  }

  if (trimmedKeyword) {
    params.set("keyword", trimmedKeyword);
  }

  return apiRequest<CursorPage<ArticleGraph>>({
    method: "GET",
    path: `/academic/articles?${params.toString()}`,
  });
}

export function getArticleById(articleId: string) {
  return apiRequest<ArticleGraph>({
    method: "GET",
    path: `/academic/articles/${encodeURIComponent(articleId)}`,
  });
}

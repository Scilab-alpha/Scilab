import { apiRequest } from "@/core/api";
import type {
  ArticleDetailResponse,
  ArticleGraph,
  ArticleListParams,
  ArticleListResponse,
} from "@/features/experiments/types/article.types";

const defaultLimit = 20;

function buildArticleQuery({
  cursor,
  q,
  limit = defaultLimit,
}: ArticleListParams = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  const trimmedQuery = q?.trim();

  if (cursor) {
    params.set("cursor", cursor);
  }

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  return params.toString();
}

/** GET /academic/articles */
export function listArticles(
  params: ArticleListParams = {},
): Promise<ArticleListResponse> {
  return apiRequest<ArticleListResponse>({
    method: "GET",
    path: `/academic/articles?${buildArticleQuery(params)}`,
  });
}

export function getArticleById(
  articleId: string,
): Promise<ArticleDetailResponse> {
  return apiRequest<ArticleGraph>({
    method: "GET",
    path: `/academic/articles/${encodeURIComponent(articleId)}`,
  });
}

import { apiRequest } from "@/core/api";
import type {
  ArticleGraphParams,
  ArticleGraphResponse,
} from "@/features/experiments/types/article-graph.types";

/** GET /academic/graphs/article/:id — related-works knowledge graph. */
export function getArticleGraph(
  articleId: string,
  params: ArticleGraphParams = {},
): Promise<ArticleGraphResponse> {
  const query = new URLSearchParams();
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiRequest<ArticleGraphResponse>({
    method: "GET",
    path: `/academic/graphs/article/${encodeURIComponent(articleId)}${suffix}`,
  });
}

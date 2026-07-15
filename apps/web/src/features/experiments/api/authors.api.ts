import { apiRequest } from "@/core/api";
import type { CursorPage } from "@/features/experiments/types/academic-pagination.types";
import type { AuthorNode } from "@/features/experiments/types/article.types";

export type AuthorListItem = Omit<AuthorNode, "authorPosition"> & {
  articleCount: number;
};

export type AuthorListParams = {
  cursor?: string | null;
  limit?: number;
};

function buildQuery({ cursor, limit = 20 }: AuthorListParams = {}) {
  const params = new URLSearchParams({ limit: String(limit) });

  if (cursor) {
    params.set("cursor", cursor);
  }

  return params.toString();
}

/** GET /academic/authors */
export function listAuthors(
  params: AuthorListParams = {},
): Promise<CursorPage<AuthorListItem>> {
  return apiRequest<CursorPage<AuthorListItem>>({
    method: "GET",
    path: `/academic/authors?${buildQuery(params)}`,
  });
}

/** GET /academic/authors/:authorId */
export function getAuthorById(authorId: string): Promise<AuthorListItem> {
  return apiRequest<AuthorListItem>({
    method: "GET",
    path: `/academic/authors/${encodeURIComponent(authorId)}`,
  });
}

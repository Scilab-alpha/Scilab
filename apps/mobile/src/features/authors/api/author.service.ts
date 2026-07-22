import { apiRequest } from "@/services/api";

import type { AuthorListItem, CursorPage } from "@/types/academic.type";

const defaultLimit = 20;

export function listAuthors({
  cursor,
  limit = defaultLimit,
}: {
  cursor?: string | null;
  limit?: number;
} = {}) {
  const params = new URLSearchParams({ limit: String(limit) });

  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiRequest<CursorPage<AuthorListItem>>({
    method: "GET",
    path: `/academic/authors?${params.toString()}`,
  });
}

export function getAuthorById(authorId: string) {
  return apiRequest<AuthorListItem>({
    method: "GET",
    path: `/academic/authors/${encodeURIComponent(authorId)}`,
  });
}

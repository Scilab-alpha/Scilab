import { apiRequest } from "@/services/api";

import type {
  CursorPage,
  JournalListItem,
} from "@/features/academic/types/article.type";

const defaultLimit = 20;

export function listJournals({
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

  return apiRequest<CursorPage<JournalListItem>>({
    method: "GET",
    path: `/academic/journals?${params.toString()}`,
  });
}

export function getJournalById(journalId: string) {
  return apiRequest<JournalListItem>({
    method: "GET",
    path: `/academic/journals/${encodeURIComponent(journalId)}`,
  });
}

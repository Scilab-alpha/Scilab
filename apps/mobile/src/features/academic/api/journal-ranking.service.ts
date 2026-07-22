import { apiRequest } from "@/services/api";

import type { CursorPage } from "@/features/academic/types/article.type";
import type { JournalRankingListItem } from "@/features/academic/types/journal-ranking.type";

const defaultLimit = 20;

export function listJournalRankings({
  cursor,
  limit = defaultLimit,
  year,
}: {
  cursor?: string | null;
  limit?: number;
  year: number;
}) {
  const params = new URLSearchParams({
    limit: String(limit),
    year: String(year),
  });

  if (cursor) {
    params.set("cursor", cursor);
  }

  return apiRequest<CursorPage<JournalRankingListItem>>({
    method: "GET",
    path: `/academic/journal-rankings?${params.toString()}`,
  });
}

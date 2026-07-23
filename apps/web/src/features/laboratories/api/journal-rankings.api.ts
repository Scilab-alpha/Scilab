import { apiRequest } from "@/core/api";
import type {
  JournalRankingListParams,
  JournalRankingListResponse,
} from "@/features/laboratories/types/journal-ranking.types";

const defaultLimit = 50;

function buildRankingQuery({
  year,
  cursor,
  limit = defaultLimit,
}: JournalRankingListParams) {
  const params = new URLSearchParams({
    year: String(year),
    limit: String(limit),
  });
  if (cursor) {
    params.set("cursor", cursor);
  }
  return params.toString();
}

/** GET /academic/journal-rankings — SCImago JR rankings for a year. */
export function listJournalRankings(
  params: JournalRankingListParams,
): Promise<JournalRankingListResponse> {
  return apiRequest<JournalRankingListResponse>({
    method: "GET",
    path: `/academic/journal-rankings?${buildRankingQuery(params)}`,
  });
}

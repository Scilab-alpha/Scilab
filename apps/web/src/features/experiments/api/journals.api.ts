import { apiRequest } from "@/core/api";
import type {
  JournalDetailResponse,
  JournalListItem,
  JournalListParams,
  JournalListResponse,
  JournalRankingListParams,
  JournalRankingListResponse,
} from "@/features/experiments/types/journal.types";

const defaultLimit = 20;

function buildJournalQuery({
  cursor,
  limit = defaultLimit,
}: JournalListParams = {}) {
  const params = new URLSearchParams({ limit: String(limit) });

  if (cursor) {
    params.set("cursor", cursor);
  }

  return params.toString();
}

/** GET /academic/journals */
export function listJournals(
  params: JournalListParams = {},
): Promise<JournalListResponse> {
  return apiRequest<JournalListResponse>({
    method: "GET",
    path: `/academic/journals?${buildJournalQuery(params)}`,
  });
}

export function buildJournalRankingQuery({
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

/** GET /academic/journal-rankings */
export function listJournalRankings(
  params: JournalRankingListParams,
): Promise<JournalRankingListResponse> {
  return apiRequest<JournalRankingListResponse>({
    method: "GET",
    path: `/academic/journal-rankings?${buildJournalRankingQuery(params)}`,
  });
}

/** GET /academic/journals/:journalId */
export function getJournalById(
  journalId: string,
): Promise<JournalDetailResponse> {
  return apiRequest<JournalListItem>({
    method: "GET",
    path: `/academic/journals/${encodeURIComponent(journalId)}`,
  });
}

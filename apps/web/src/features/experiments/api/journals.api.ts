import { apiRequest } from "@/core/api";
import type {
  JournalDetailResponse,
  JournalListItem,
  JournalListParams,
  JournalListResponse,
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

/** GET /academic/journals/:journalId */
export function getJournalById(journalId: string): Promise<JournalDetailResponse> {
  return apiRequest<JournalListItem>({
    method: "GET",
    path: `/academic/journals/${encodeURIComponent(journalId)}`,
  });
}

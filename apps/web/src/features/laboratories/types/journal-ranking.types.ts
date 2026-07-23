import type { CursorPage } from "@/features/experiments/types/academic-pagination.types";

export type JournalRankingMatchStatus =
  | "PENDING"
  | "MATCHED"
  | "UNMATCHED"
  | "CONFLICT"
  | "OUT_OF_SCOPE";

/** One row from GET /academic/journal-rankings. */
export type JournalRankingItem = {
  scimagoSourceId: string;
  journalId: string | null;
  issns: string[];
  matchStatus: JournalRankingMatchStatus;
  title: string;
  type: string | null;
  sjr: number | null;
  hIndex: number | null;
  totalDocs: number | null;
  totalDocs3Years: number | null;
  totalRefs: number | null;
  totalCitations3Years: number | null;
  citableDocs3Years: number | null;
  citationsPerDoc2Years: number | null;
  refsPerDoc: number | null;
  femalePercentage: number | null;
  countryCode: string | null;
};

export type JournalRankingListParams = {
  year: number;
  cursor?: string | null;
  limit?: number;
};

export type JournalRankingListResponse = CursorPage<JournalRankingItem>;

/** Years currently served by the public SCImago dataset. */
export const JOURNAL_RANKING_YEARS = [2025, 2024, 2023] as const;

export const DEFAULT_JOURNAL_RANKING_YEAR = 2025;

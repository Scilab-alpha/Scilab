import type { CursorPage } from "@/features/experiments/types/academic-pagination.types";

/** Journal nested inside an article graph response. */
export type JournalNode = {
  id: string;
  sourceId: string | null;
  displayName: string | null;
  type: string | null;
  isOpenAccess: boolean | null;
  isOaDiamond: boolean | null;
  coverage: string | null;
  country: string | null;
  issnList: string[] | null;
  publisherName: string | null;
  publisherImageUrl: string | null;
  subjectCategories: string[] | null;
};

/** Journal item returned by GET /academic/journals endpoints. */
export type JournalListItem = JournalNode & {
  articleCount: number;
};

export type JournalListParams = {
  cursor?: string | null;
  limit?: number;
};

export type JournalListResponse = CursorPage<JournalListItem>;
export type JournalDetailResponse = JournalListItem;

export const JOURNAL_RANKING_YEARS = [2025, 2024, 2023] as const;
export type JournalRankingYear = (typeof JOURNAL_RANKING_YEARS)[number];

export type JournalRankingMatchStatus =
  | "PENDING"
  | "MATCHED"
  | "UNMATCHED"
  | "CONFLICT"
  | "OUT_OF_SCOPE";

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
  year: JournalRankingYear;
  cursor?: string | null;
  limit?: number;
};

export type JournalRankingListResponse = CursorPage<JournalRankingItem>;

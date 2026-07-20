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
  region: string | null;
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
  /** Free-text search (`q` on GET /academic/journals). */
  q?: string | null;
  limit?: number;
};

export type JournalListResponse = CursorPage<JournalListItem>;
export type JournalDetailResponse = JournalListItem;

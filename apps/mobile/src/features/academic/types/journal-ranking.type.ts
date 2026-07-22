export type JournalRankingMatchStatus =
  | "PENDING"
  | "MATCHED"
  | "UNMATCHED"
  | "CONFLICT"
  | "OUT_OF_SCOPE";

export type JournalRankingListItem = {
  citableDocs3Years: number | null;
  citationsPerDoc2Years: number | null;
  countryCode: string | null;
  femalePercentage: number | null;
  hIndex: number | null;
  issns: string[];
  journalId: string | null;
  matchStatus: JournalRankingMatchStatus;
  refsPerDoc: number | null;
  scimagoSourceId: string;
  sjr: number | null;
  title: string;
  totalCitations3Years: number | null;
  totalDocs: number | null;
  totalDocs3Years: number | null;
  totalRefs: number | null;
  type: string | null;
};

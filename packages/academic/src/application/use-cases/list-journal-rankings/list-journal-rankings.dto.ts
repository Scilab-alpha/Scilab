export interface ListJournalRankingsInput {
  year: number;
  cursor: string | null;
  limit: number;
}

export interface JournalRankingListItem {
  scimagoSourceId: string;
  journalId: string | null;
  issns: string[];
  matchStatus:
    | 'PENDING'
    | 'MATCHED'
    | 'UNMATCHED'
    | 'CONFLICT'
    | 'OUT_OF_SCOPE';
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
}

export interface ListJournalRankingsOutput {
  items: JournalRankingListItem[];
  nextCursor: string | null;
}

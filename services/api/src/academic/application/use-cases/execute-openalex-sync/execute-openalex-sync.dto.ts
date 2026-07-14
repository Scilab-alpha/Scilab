export interface ExecuteOpenAlexSyncOutput {
  syncLogId: string;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
  rankingMatched: number;
  rankingUnmatched: number;
  rankingConflicts: number;
  rankingRowsUpserted: number;
  nextCursor: string | null;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
}

export interface ExecuteOpenAlexSyncInput {
  cursor?: string | null;
  maxPages?: number;
  filter?: string;
}

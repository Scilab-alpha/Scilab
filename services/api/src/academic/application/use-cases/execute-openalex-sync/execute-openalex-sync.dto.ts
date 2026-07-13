export interface ExecuteOpenAlexSyncOutput {
  syncLogId: string;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
}

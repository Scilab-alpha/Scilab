export const ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY = Symbol(
  'ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY',
);

export type AcademicJournalMatchStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'UNMATCHED'
  | 'CONFLICT';
export type AcademicJournalSyncMode = 'BACKFILL' | 'INCREMENTAL';

export interface AcademicJournalSyncState {
  scimagoSourceId: string;
  catalogYear: number;
  openAlexJournalId: string | null;
  matchStatus: AcademicJournalMatchStatus;
  matchedIssn: string | null;
  candidateJournalIds: string[];
  syncMode: AcademicJournalSyncMode;
  cursor: string | null;
  filterSignature: string | null;
  incrementalWindowFrom: Date | null;
  initialBackfillComplete: boolean;
  lastResolvedAt: Date | null;
  lastSuccessfulAt: Date | null;
  errorDetail: string | null;
}

export interface AcademicJournalSyncStateRepository {
  findByScimagoSourceIds(ids: string[]): Promise<AcademicJournalSyncState[]>;
  listMatchedBackfillContinuations(
    limit: number,
  ): Promise<AcademicJournalSyncState[]>;
  upsert(state: AcademicJournalSyncState): Promise<void>;
}

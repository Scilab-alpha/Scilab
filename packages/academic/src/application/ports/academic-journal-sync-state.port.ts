export const ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY = Symbol(
  'ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY',
);

export type AcademicJournalMatchStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'UNMATCHED'
  | 'CONFLICT';
export type AcademicJournalSyncMode = 'BACKFILL' | 'INCREMENTAL';
export type SemanticScholarSupplementStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_SHORTFALL'
  | 'FAILED';

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
  semanticScholarStatus?: SemanticScholarSupplementStatus;
  semanticScholarNewToken?: string | null;
  semanticScholarNewAccepted?: number;
  semanticScholarRelatedAccepted?: number;
  semanticScholarProcessedSeedIds?: string[];
  semanticScholarStartedAt?: Date | null;
  semanticScholarCompletedAt?: Date | null;
  semanticScholarErrorDetail?: string | null;
}

export interface AcademicJournalSyncStateRepository {
  findByScimagoSourceIds(ids: string[]): Promise<AcademicJournalSyncState[]>;
  listMatchedBackfillContinuations(
    limit: number,
  ): Promise<AcademicJournalSyncState[]>;
  claimSemanticScholarStates(
    scimagoSourceIds: string[],
  ): Promise<AcademicJournalSyncState[]>;
  upsert(state: AcademicJournalSyncState): Promise<void>;
}

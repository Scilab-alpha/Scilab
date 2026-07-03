export type AcademicSyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL';

export interface StartOpenAlexSyncLogInput {
  startedAt: Date;
  apiEndpoint: string;
}

export interface CompleteOpenAlexSyncLogInput {
  finishedAt: Date;
  status: Exclude<AcademicSyncStatus, 'FAILED'>;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
}

export interface FailOpenAlexSyncLogInput {
  finishedAt: Date;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
  errorDetail: string;
}

export interface AcademicSyncLogRepository {
  startOpenAlexScheduledSync(input: StartOpenAlexSyncLogInput): Promise<string>;
  completeOpenAlexSync(
    syncLogId: string,
    input: CompleteOpenAlexSyncLogInput,
  ): Promise<void>;
  failOpenAlexSync(
    syncLogId: string,
    input: FailOpenAlexSyncLogInput,
  ): Promise<void>;
}

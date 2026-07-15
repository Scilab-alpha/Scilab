export type AcademicSyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL';
export type AcademicSyncSource = 'OPENALEX' | 'SCIMAGO';
export type AcademicSyncJobType =
  | 'SCIMAGO_RELOAD'
  | 'JOURNAL_SOURCE_SYNC'
  | 'JOURNAL_ARTICLE_SYNC'
  | 'OUTGOING_REFERENCE_CRAWL'
  | 'REFERENCE_HYDRATION'
  | 'INCOMING_CITATION_CRAWL'
  | 'CITATION_COUNT_REFRESH';

export interface StartAcademicPipelineJobInput {
  apiName: string;
  apiEndpoint: string;
  source: AcademicSyncSource;
  jobType: AcademicSyncJobType;
  startedAt: Date;
}

export interface CompleteAcademicPipelineJobInput {
  finishedAt: Date;
  status: Exclude<AcademicSyncStatus, 'FAILED'>;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
}

export interface FailAcademicPipelineJobInput {
  finishedAt: Date;
  totalFetched: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
  errorDetail: string;
}

export interface AcademicSyncLogRepository {
  startPipelineJob(input: StartAcademicPipelineJobInput): Promise<string>;
  completePipelineJob(
    syncLogId: string,
    input: CompleteAcademicPipelineJobInput,
  ): Promise<void>;
  failPipelineJob(
    syncLogId: string,
    input: FailAcademicPipelineJobInput,
  ): Promise<void>;
}

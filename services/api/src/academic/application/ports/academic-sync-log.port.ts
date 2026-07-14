export type AcademicSyncStatus = 'SUCCESS' | 'FAILED' | 'PARTIAL';
export type AcademicSyncSource = 'OPENALEX' | 'SCIMAGO';
export type AcademicSyncJobType =
  | 'SCIMAGO_RELOAD'
  | 'ARTICLE_SYNC'
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
  startPipelineJob?(input: StartAcademicPipelineJobInput): Promise<string>;
  completePipelineJob?(
    syncLogId: string,
    input: CompleteOpenAlexSyncLogInput,
  ): Promise<void>;
  failPipelineJob?(
    syncLogId: string,
    input: FailOpenAlexSyncLogInput,
  ): Promise<void>;
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

export interface OpenAlexConfigReader {
  getOpenAlexConfig(): OpenAlexConfig;
  getJournalSyncConfig?(): OpenAlexJournalSyncConfig;
}

export interface OpenAlexConfig {
  apiKey?: string;
  baseUrl: string;
}

export interface OpenAlexWorksQueryConfig extends OpenAlexConfig {
  filter?: string;
  sort?: string;
  perPage: number;
}

export interface OpenAlexJournalSyncConfig extends OpenAlexConfig {
  journalBackfillFromYear: number;
  dailyPageBudget: number;
  priorityPercent: number;
  maxPagesPerPass: number;
  sourceBatchSize: number;
  journalBatchSize: number;
  outgoingReferenceBatchSize: number;
  relatedRefreshDays?: number;
  relatedRootBatchSize?: number;
  relatedRootMaxBatches?: number;
  relatedTargetBatchSize?: number;
  relatedTargetMaxBatches?: number;
  relatedTargetMaxAttempts?: number;
}

export interface OpenAlexRelatedWorkSyncConfig extends OpenAlexConfig {
  relatedRefreshDays: number;
  relatedRootBatchSize: number;
  relatedRootMaxBatches: number;
  relatedTargetBatchSize: number;
  relatedTargetMaxBatches: number;
  relatedTargetMaxAttempts: number;
}

export function getRelatedWorkSyncConfig(
  reader: OpenAlexConfigReader,
): OpenAlexRelatedWorkSyncConfig {
  const config = getJournalSyncConfig(reader);

  return {
    ...config,
    relatedRefreshDays: config.relatedRefreshDays ?? 30,
    relatedRootBatchSize: config.relatedRootBatchSize ?? 100,
    relatedRootMaxBatches: config.relatedRootMaxBatches ?? 10,
    relatedTargetBatchSize: config.relatedTargetBatchSize ?? 100,
    relatedTargetMaxBatches: config.relatedTargetMaxBatches ?? 10,
    relatedTargetMaxAttempts: config.relatedTargetMaxAttempts ?? 3,
  };
}

export function getJournalSyncConfig(
  reader: OpenAlexConfigReader,
): OpenAlexJournalSyncConfig {
  return (
    reader.getJournalSyncConfig?.() ?? {
      ...reader.getOpenAlexConfig(),
      journalBackfillFromYear: 2020,
      dailyPageBudget: 1000,
      priorityPercent: 80,
      maxPagesPerPass: 10,
      sourceBatchSize: 100,
      journalBatchSize: 100,
      outgoingReferenceBatchSize: 100,
      relatedRefreshDays: 30,
      relatedRootBatchSize: 100,
      relatedRootMaxBatches: 10,
      relatedTargetBatchSize: 100,
      relatedTargetMaxBatches: 10,
      relatedTargetMaxAttempts: 3,
    }
  );
}

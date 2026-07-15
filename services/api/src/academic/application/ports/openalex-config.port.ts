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
  maxPagesPerPass: number;
  sourceBatchSize: number;
  journalBatchSize: number;
  outgoingReferenceBatchSize: number;
}

export function getJournalSyncConfig(
  reader: OpenAlexConfigReader,
): OpenAlexJournalSyncConfig {
  return (
    reader.getJournalSyncConfig?.() ?? {
      ...reader.getOpenAlexConfig(),
      journalBackfillFromYear: 2020,
      dailyPageBudget: 1000,
      maxPagesPerPass: 10,
      sourceBatchSize: 100,
      journalBatchSize: 100,
      outgoingReferenceBatchSize: 100,
    }
  );
}

export interface RunJournalArticleSyncPipelineOutput {
  journalsVisited: number;
  pagesFetched: number;
  articlesInserted: number;
  articlesUpdated: number;
  cursorsRemaining: number;
  errors: number;
}

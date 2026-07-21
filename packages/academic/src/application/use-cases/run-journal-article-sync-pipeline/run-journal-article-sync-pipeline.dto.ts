export interface RunJournalArticleSyncPipelineOutput {
  journalsVisited: number;
  priorityJournalsVisited: number;
  continuationJournalsVisited: number;
  pagesFetched: number;
  pagesAttempted: number;
  priorityPagesFetched: number;
  continuationPagesFetched: number;
  priorityPagesAttempted: number;
  continuationPagesAttempted: number;
  articlesInserted: number;
  articlesUpdated: number;
  cursorsRemaining: number;
  errors: number;
}

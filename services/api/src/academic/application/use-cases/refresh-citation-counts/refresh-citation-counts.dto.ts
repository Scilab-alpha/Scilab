export interface RefreshCitationCountsOutput {
  requested: number;
  updated: number;
  unmatchedArticleIds: string[];
}

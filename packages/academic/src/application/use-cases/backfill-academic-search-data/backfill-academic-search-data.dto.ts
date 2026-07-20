export interface BackfillAcademicSearchDataInput {
  batchSize?: number;
}

export interface BackfillAcademicSearchDataOutput {
  publishersNormalized: number;
  citationsUpdated: number;
  unmatchedArticleIds: string[];
}

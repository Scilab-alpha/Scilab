export const SEMANTIC_SCHOLAR_PAPER_SOURCE = Symbol(
  'SEMANTIC_SCHOLAR_PAPER_SOURCE',
);

export interface SemanticScholarConfig {
  apiKey?: string;
  baseUrl: string;
  requestsPerSecond?: number;
}

export interface SemanticScholarSupplementConfig extends SemanticScholarConfig {
  journalBackfillFromYear: number;
  newTarget: number;
  relatedTarget: number;
  maxJournalsPerRun: number;
  maxBulkPagesPerJournal: number;
  maxRecommendationSeeds: number;
  requestsPerSecond: number;
}

export interface SemanticScholarConfigReader {
  getSemanticScholarSupplementConfig(): SemanticScholarSupplementConfig;
}

export interface SemanticScholarBulkSearchInput {
  config: SemanticScholarConfig;
  venue: string;
  fromYear: number;
  sort: 'publicationDate:desc' | 'citationCount:desc';
  token?: string | null;
}

export interface SemanticScholarRecommendationsInput {
  config: SemanticScholarConfig;
  positivePaperId: string;
  limit: number;
}

export interface SemanticScholarPaperSource {
  searchBulk(
    input: SemanticScholarBulkSearchInput,
  ): Promise<SemanticScholarBulkSearchPage>;
  getRecommendations(
    input: SemanticScholarRecommendationsInput,
  ): Promise<SemanticScholarRecommendationsPage>;
}

export interface SemanticScholarBulkSearchPage {
  token?: string | null;
  data: SemanticScholarPaperRecord[];
}

export interface SemanticScholarRecommendationsPage {
  recommendedPapers: SemanticScholarPaperRecord[];
}

export interface SemanticScholarPaperRecord {
  paperId?: string | null;
  externalIds?: {
    DOI?: string | null;
  } | null;
  title?: string | null;
  abstract?: string | null;
  year?: number | null;
  publicationDate?: string | null;
  citationCount?: number | null;
  publicationTypes?: string[] | null;
  venue?: string | null;
  publicationVenue?: {
    id?: string | null;
    name?: string | null;
    type?: string | null;
  } | null;
}

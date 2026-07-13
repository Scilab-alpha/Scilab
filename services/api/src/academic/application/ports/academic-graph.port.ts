import {
  AcademicNodeType,
  ArticleListInput,
  ArticleGraph,
  AuthorListItem,
  CursorPage,
  CursorPaginationInput,
  JournalListItem,
} from '@/academic/domain/academic-graph.model';

export const ACADEMIC_GRAPH_REPOSITORY = Symbol('ACADEMIC_GRAPH_REPOSITORY');

export interface AcademicGraphRepository {
  ensureSchema(): Promise<void>;
  upsertArticleGraph(graph: ArticleGraph): Promise<void>;
  listArticles(input: ArticleListInput): Promise<CursorPage<ArticleGraph>>;
  getArticleById(id: string): Promise<ArticleGraph | null>;
  listAuthors(
    input: CursorPaginationInput,
  ): Promise<CursorPage<AuthorListItem>>;
  getAuthorById(id: string): Promise<AuthorListItem | null>;
  listJournals(
    input: CursorPaginationInput,
  ): Promise<CursorPage<JournalListItem>>;
  getJournalById(id: string): Promise<JournalListItem | null>;
  findArticlesByIds(ids: string[]): Promise<ArticleGraph[]>;
  findExistingReferenceIds(
    type: AcademicNodeType,
    ids: string[],
  ): Promise<Set<string>>;
  backfillHydrationStateAndRemoveRegion(): Promise<void>;
  listJournalsForPublisherNormalization(
    input: CursorPaginationInput,
  ): Promise<CursorPage<{ id: string; publisherName: string }>>;
  updatePublisherNameNormalizations(
    updates: Array<{ id: string; normalizedName: string }>,
  ): Promise<void>;
  listHydratedArticleIdsMissingCitation(
    input: CursorPaginationInput,
  ): Promise<CursorPage<string>>;
  updateArticleCitationCounts(
    updates: Array<{ id: string; citationCount: number }>,
  ): Promise<void>;
}

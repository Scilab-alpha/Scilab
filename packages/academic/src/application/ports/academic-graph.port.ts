import {
  AcademicNodeType,
  ArticleListInput,
  ArticleGraph,
  AuthorListItem,
  CursorPage,
  CursorPaginationInput,
  JournalListItem,
  JournalNode,
  RelatedWorkSnapshot,
} from '@repo/academic/domain/academic-graph.model';

export const ACADEMIC_GRAPH_REPOSITORY = Symbol('ACADEMIC_GRAPH_REPOSITORY');

export type FollowableAcademicNodeType = 'JOURNAL' | 'KEYWORD' | 'TOPIC';

export interface FollowTargetReference {
  type: FollowableAcademicNodeType;
  id: string;
}

export interface FollowTargetRecord {
  type: FollowableAcademicNodeType;
  id: string;
  displayName: string | null;
  sourceId?: string | null;
  journalType?: string | null;
  country?: string | null;
  region?: string | null;
  score?: number | null;
}

export interface ArticleFollowMatch {
  article: ArticleGraph;
  matches: FollowTargetReference[];
}

export interface FollowedTargetGroups {
  journals: string[];
  keywords: string[];
  topics: string[];
}

export interface AcademicGraphRepository {
  ensureSchema(): Promise<void>;
  upsertArticleGraph(graph: ArticleGraph): Promise<void>;
  upsertArticleGraphs(
    graphs: ArticleGraph[],
  ): Promise<{ inserted: number; updated: number }>;
  upsertJournal(journal: JournalNode): Promise<void>;
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
  findFollowTargetsByReferences(
    refs: FollowTargetReference[],
  ): Promise<FollowTargetRecord[]>;
  findArticlesMatchingFollowedTargets(
    groups: FollowedTargetGroups,
    since: Date,
  ): Promise<ArticleFollowMatch[]>;
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
  listPlaceholderArticleIds(limit: number): Promise<string[]>;
  listHydratedArticleIdsMissingOutgoingReferences(
    limit: number,
  ): Promise<string[]>;
  markOutgoingReferencesCrawled(ids: string[]): Promise<void>;
  listHydratedArticleIdsForIncomingCitation(input: {
    limit: number;
    ingestedSince: Date;
  }): Promise<string[]>;
  markIncomingCitationCrawled(ids: string[]): Promise<void>;
  listHydratedArticleIdsNeedingCitation(input: {
    limit: number;
    staleBefore: Date;
  }): Promise<string[]>;
  updateArticleCitationCounts(
    updates: Array<{ id: string; citationCount: number }>,
  ): Promise<void>;
  backfillRelatedWorkSyncEligibility(): Promise<void>;
  listRelatedWorkSyncRootIds(input: {
    limit: number;
    staleBefore: Date;
  }): Promise<string[]>;
  listPendingRelatedWorkTargetIds(limit: number): Promise<string[]>;
  activatePendingRelatedWorkTargets(ids: string[]): Promise<void>;
  discardPendingRelatedWorkTargets(ids: string[]): Promise<void>;
  incrementPendingRelatedWorkAttempts(
    ids: string[],
    maxAttempts: number,
  ): Promise<void>;
  replaceRelatedWorkSnapshots(snapshots: RelatedWorkSnapshot[]): Promise<void>;
}

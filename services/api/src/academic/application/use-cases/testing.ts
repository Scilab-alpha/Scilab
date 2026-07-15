import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';

export function createAcademicGraphRepositoryDouble(
  overrides: Partial<AcademicGraphRepository> = {},
): AcademicGraphRepository {
  return {
    ensureSchema: jest.fn().mockResolvedValue(undefined),
    upsertArticleGraph: jest.fn().mockResolvedValue(undefined),
    upsertArticleGraphs: jest
      .fn()
      .mockResolvedValue({ inserted: 0, updated: 0 }),
    upsertJournal: jest.fn().mockResolvedValue(undefined),
    listArticles: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getArticleById: jest.fn().mockResolvedValue(null),
    listAuthors: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getAuthorById: jest.fn().mockResolvedValue(null),
    listJournals: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getJournalById: jest.fn().mockResolvedValue(null),
    findArticlesByIds: jest.fn().mockResolvedValue([]),
    findFollowTargetsByReferences: jest.fn().mockResolvedValue([]),
    findArticlesMatchingFollowedTargets: jest.fn().mockResolvedValue([]),
    findExistingReferenceIds: jest.fn().mockResolvedValue(new Set()),
    backfillHydrationStateAndRemoveRegion: jest
      .fn()
      .mockResolvedValue(undefined),
    listJournalsForPublisherNormalization: jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null }),
    updatePublisherNameNormalizations: jest.fn().mockResolvedValue(undefined),
    listHydratedArticleIdsMissingCitation: jest
      .fn()
      .mockResolvedValue({ items: [], nextCursor: null }),
    listPlaceholderArticleIds: jest.fn().mockResolvedValue([]),
    listHydratedArticleIdsMissingOutgoingReferences: jest
      .fn()
      .mockResolvedValue([]),
    markOutgoingReferencesCrawled: jest.fn().mockResolvedValue(undefined),
    listHydratedArticleIdsForIncomingCitation: jest.fn().mockResolvedValue([]),
    markIncomingCitationCrawled: jest.fn().mockResolvedValue(undefined),
    listHydratedArticleIdsNeedingCitation: jest.fn().mockResolvedValue([]),
    updateArticleCitationCounts: jest.fn().mockResolvedValue(undefined),
    backfillRelatedWorkSyncEligibility: jest.fn().mockResolvedValue(undefined),
    listRelatedWorkSyncRootIds: jest.fn().mockResolvedValue([]),
    listPendingRelatedWorkTargetIds: jest.fn().mockResolvedValue([]),
    activatePendingRelatedWorkTargets: jest.fn().mockResolvedValue(undefined),
    discardPendingRelatedWorkTargets: jest.fn().mockResolvedValue(undefined),
    incrementPendingRelatedWorkAttempts: jest.fn().mockResolvedValue(undefined),
    replaceRelatedWorkSnapshots: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

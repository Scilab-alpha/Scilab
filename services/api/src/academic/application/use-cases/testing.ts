import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';

export function createAcademicGraphRepositoryDouble(
  overrides: Partial<AcademicGraphRepository> = {},
): AcademicGraphRepository {
  return {
    ensureSchema: jest.fn().mockResolvedValue(undefined),
    upsertArticleGraph: jest.fn().mockResolvedValue(undefined),
    listArticles: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getArticleById: jest.fn().mockResolvedValue(null),
    listAuthors: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getAuthorById: jest.fn().mockResolvedValue(null),
    listJournals: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getJournalById: jest.fn().mockResolvedValue(null),
    findArticlesByIds: jest.fn().mockResolvedValue([]),
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
    updateArticleCitationCounts: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

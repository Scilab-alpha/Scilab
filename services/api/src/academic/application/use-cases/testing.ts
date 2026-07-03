import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';

export function createAcademicGraphRepositoryDouble(
  overrides: Partial<AcademicGraphRepository> = {},
): AcademicGraphRepository {
  return {
    ensureSchema: jest.fn().mockResolvedValue(undefined),
    upsertArticleGraph: jest.fn().mockResolvedValue(undefined),
    listArticles: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getArticleById: jest.fn().mockResolvedValue(null),
    listJournals: jest.fn().mockResolvedValue({ items: [], nextCursor: null }),
    getJournalById: jest.fn().mockResolvedValue(null),
    findArticlesByIds: jest.fn().mockResolvedValue([]),
    findExistingReferenceIds: jest.fn().mockResolvedValue(new Set()),
    ...overrides,
  };
}

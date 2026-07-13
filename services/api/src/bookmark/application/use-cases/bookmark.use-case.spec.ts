/* eslint-disable @typescript-eslint/unbound-method */
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { BookmarkRepository } from '@/bookmark/application/ports/bookmark.ports';
import { ListBookmarksUseCase } from '@/bookmark/application/use-cases/list-bookmarks/list-bookmarks.use-case';
import { ToggleBookmarkUseCase } from '@/bookmark/application/use-cases/toggle-bookmark/toggle-bookmark.use-case';
import {
  BookmarkFailureReason,
  BookmarkUseCaseError,
} from '@/bookmark/domain/bookmark.errors';

const userId = '11111111-1111-4111-8111-111111111111';
const articleId = '22222222-2222-4222-8222-222222222222';
const otherArticleId = '33333333-3333-4333-8333-333333333333';
const createdAt = new Date('2026-01-01T00:00:00.000Z');

function createBookmarkRepository(): jest.Mocked<BookmarkRepository> {
  return {
    findByUserAndArticle: jest.fn(),
    create: jest.fn(),
    deleteByUserAndArticle: jest.fn(),
    listByUser: jest.fn(),
    listArticleIds: jest.fn(),
    deleteByArticleIds: jest.fn(),
  };
}

function createGraphRepository(): jest.Mocked<AcademicGraphRepository> {
  return {
    ensureSchema: jest.fn(),
    upsertArticleGraph: jest.fn(),
    listArticles: jest.fn(),
    getArticleById: jest.fn(),
    listAuthors: jest.fn(),
    getAuthorById: jest.fn(),
    listJournals: jest.fn(),
    getJournalById: jest.fn(),
    findArticlesByIds: jest.fn(),
    findExistingReferenceIds: jest.fn(),
    backfillHydrationStateAndRemoveRegion: jest.fn(),
    listJournalsForPublisherNormalization: jest.fn(),
    updatePublisherNameNormalizations: jest.fn(),
    listHydratedArticleIdsMissingCitation: jest.fn(),
    updateArticleCitationCounts: jest.fn(),
  };
}

describe('Bookmark use cases', () => {
  it('toggles a missing bookmark on after validating the Article node', async () => {
    const bookmarks = createBookmarkRepository();
    const graph = createGraphRepository();
    bookmarks.findByUserAndArticle.mockResolvedValue(null);
    graph.findExistingReferenceIds.mockResolvedValue(new Set([articleId]));
    bookmarks.create.mockResolvedValue({
      id: 'bookmark-1',
      userId,
      articleId,
      createdAt,
    });

    const result = await new ToggleBookmarkUseCase(bookmarks, graph).execute({
      userId,
      articleId,
    });

    expect(result).toEqual({
      articleId,
      bookmarked: true,
      bookmarkedAt: createdAt,
    });
    expect(graph.findExistingReferenceIds).toHaveBeenCalledWith('ARTICLE', [
      articleId,
    ]);
  });

  it('toggles an existing bookmark off without validating Neo4j', async () => {
    const bookmarks = createBookmarkRepository();
    const graph = createGraphRepository();
    bookmarks.findByUserAndArticle.mockResolvedValue({
      id: 'bookmark-1',
      userId,
      articleId,
      createdAt,
    });
    bookmarks.deleteByUserAndArticle.mockResolvedValue(true);

    await expect(
      new ToggleBookmarkUseCase(bookmarks, graph).execute({
        userId,
        articleId,
      }),
    ).resolves.toEqual({ articleId, bookmarked: false });
    expect(graph.findExistingReferenceIds).not.toHaveBeenCalled();
  });

  it('rejects invalid article ids and missing Article nodes', async () => {
    const bookmarks = createBookmarkRepository();
    const graph = createGraphRepository();
    bookmarks.findByUserAndArticle.mockResolvedValue(null);
    graph.findExistingReferenceIds.mockResolvedValue(new Set());
    const useCase = new ToggleBookmarkUseCase(bookmarks, graph);

    await expect(
      useCase.execute({ userId, articleId: 'not-a-uuid' }),
    ).rejects.toMatchObject({
      reason: BookmarkFailureReason.InvalidInput,
    } satisfies Partial<BookmarkUseCaseError>);
    await expect(useCase.execute({ userId, articleId })).rejects.toMatchObject({
      reason: BookmarkFailureReason.ArticleMissing,
    } satisfies Partial<BookmarkUseCaseError>);
  });

  it('lists bookmarks in Postgres order and skips Neo4j orphans', async () => {
    const bookmarks = createBookmarkRepository();
    const graph = createGraphRepository();
    bookmarks.listByUser.mockResolvedValue([
      { id: 'bookmark-1', userId, articleId, createdAt },
      {
        id: 'bookmark-2',
        userId,
        articleId: otherArticleId,
        createdAt: new Date('2025-12-01T00:00:00.000Z'),
      },
    ]);
    graph.findArticlesByIds.mockResolvedValue([
      {
        article: {
          id: articleId,
          title: 'Graph Databases for Science',
          createdAt,
        },
      },
    ]);

    const result = await new ListBookmarksUseCase(bookmarks, graph).execute({
      userId,
      page: '1',
      limit: '20',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      articleId,
      bookmarkedAt: createdAt,
      article: { id: articleId, title: 'Graph Databases for Science' },
    });
    expect(result.hasMore).toBe(false);
  });

  it('rejects invalid pagination instead of silently defaulting', async () => {
    const bookmarks = createBookmarkRepository();
    const graph = createGraphRepository();

    await expect(
      new ListBookmarksUseCase(bookmarks, graph).execute({
        userId,
        page: '0',
        limit: '20',
      }),
    ).rejects.toMatchObject({
      reason: BookmarkFailureReason.InvalidInput,
    } satisfies Partial<BookmarkUseCaseError>);
    expect(bookmarks.listByUser).not.toHaveBeenCalled();
  });
});

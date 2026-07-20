import { AcademicGraphRepository } from '@repo/academic/domain';
import { BookmarkRepository } from '@/bookmark/application/ports/bookmark.ports';
import { BookmarkFailureReason } from '@/bookmark/domain/bookmark.errors';
import { ToggleBookmarkUseCase } from './toggle-bookmark.use-case';

describe('ToggleBookmarkUseCase', () => {
  const userId = '11111111-1111-4111-8111-111111111111';

  function createSut(overrides?: {
    bookmarks?: Partial<BookmarkRepository>;
    graph?: Partial<AcademicGraphRepository>;
  }) {
    const bookmarks: BookmarkRepository = {
      findByUserAndArticle: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((inputUserId, articleId) =>
        Promise.resolve({
          id: 'bookmark-1',
          userId: inputUserId,
          articleId,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
        }),
      ),
      deleteByUserAndArticle: jest.fn().mockResolvedValue(true),
      listByUser: jest.fn().mockResolvedValue([]),
      listArticleIds: jest.fn().mockResolvedValue([]),
      deleteByArticleIds: jest.fn().mockResolvedValue(0),
      ...overrides?.bookmarks,
    };

    const graph = {
      findExistingReferenceIds: jest
        .fn()
        .mockResolvedValue(new Set(['W1234567890'])),
      ...overrides?.graph,
    } as AcademicGraphRepository;

    return {
      bookmarks,
      graph,
      useCase: new ToggleBookmarkUseCase(bookmarks, graph),
    };
  }

  it('creates a bookmark for an OpenAlex article id', async () => {
    const { bookmarks, useCase } = createSut();

    await expect(
      useCase.execute({ userId, articleId: ' W1234567890 ' }),
    ).resolves.toMatchObject({
      articleId: 'W1234567890',
      bookmarked: true,
    });
    expect(bookmarks.create).toHaveBeenCalledWith(userId, 'W1234567890');
  });

  it('rejects a missing article id before repository access', async () => {
    const { bookmarks, useCase } = createSut();

    await expect(
      useCase.execute({ userId, articleId: ' ' }),
    ).rejects.toMatchObject({
      reason: BookmarkFailureReason.InvalidInput,
    });
    expect(bookmarks.findByUserAndArticle).not.toHaveBeenCalled();
  });
});

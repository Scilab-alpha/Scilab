import { AcademicGraphRepository } from '@repo/academic/domain';
import { BookmarkRepository } from '@/bookmark/application/ports/bookmark.ports';
import {
  ToggleBookmarkInput,
  ToggleBookmarkOutput,
} from '@/bookmark/application/use-cases/toggle-bookmark/toggle-bookmark.dto';
import {
  BookmarkFailureReason,
  BookmarkUseCaseError,
} from '@/bookmark/domain/bookmark.errors';

export class ToggleBookmarkUseCase {
  constructor(
    private readonly bookmarks: BookmarkRepository,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(input: ToggleBookmarkInput): Promise<ToggleBookmarkOutput> {
    const articleId = this.parseArticleId(input.articleId);
    const existing = await this.bookmarks.findByUserAndArticle(
      input.userId,
      articleId,
    );

    if (existing) {
      await this.bookmarks.deleteByUserAndArticle(input.userId, articleId);
      return { articleId, bookmarked: false };
    }

    const existingIds = await this.graph.findExistingReferenceIds('ARTICLE', [
      articleId,
    ]);
    if (!existingIds.has(articleId)) {
      throw new BookmarkUseCaseError(
        BookmarkFailureReason.ArticleMissing,
        'Article not found',
      );
    }

    const created = await this.bookmarks.create(input.userId, articleId);
    return {
      articleId,
      bookmarked: true,
      bookmarkedAt: created.createdAt,
    };
  }

  private parseArticleId(value: unknown): string {
    if (typeof value !== 'string') {
      throw new BookmarkUseCaseError(
        BookmarkFailureReason.InvalidInput,
        'articleId is required',
      );
    }

    const articleId = value.trim();
    if (!articleId) {
      throw new BookmarkUseCaseError(
        BookmarkFailureReason.InvalidInput,
        'articleId is required',
      );
    }

    if (articleId.length > 128) {
      throw new BookmarkUseCaseError(
        BookmarkFailureReason.InvalidInput,
        'articleId must not exceed 128 characters',
      );
    }

    return articleId;
  }
}

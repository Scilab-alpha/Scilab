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
    const articleId = input.articleId as string;
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
}

import { toArticleGraphOutput } from '@repo/academic/domain';
import { AcademicGraphRepository } from '@repo/academic/domain';
import { BookmarkRepository } from '@/bookmark/application/ports/bookmark.ports';
import {
  ListBookmarksInput,
  ListBookmarksOutput,
} from '@/bookmark/application/use-cases/list-bookmarks/list-bookmarks.dto';
import {
  BookmarkFailureReason,
  BookmarkUseCaseError,
} from '@/bookmark/domain/bookmark.errors';
import { parsePagination } from '@/shared/validation/request-input';

export class ListBookmarksUseCase {
  constructor(
    private readonly bookmarks: BookmarkRepository,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(input: ListBookmarksInput): Promise<ListBookmarksOutput> {
    const pagination = this.parsePagination(input);
    const records = await this.bookmarks.listByUser({
      userId: input.userId,
      skip: pagination.skip,
      take: pagination.take,
    });
    const pageRecords = records.slice(0, pagination.limit);
    const articleIds = pageRecords.map((record) => record.articleId);
    const articleGraphs = await this.graph.findArticlesByIds(articleIds);
    const articlesById = new Map(
      articleGraphs.map((graph) => [graph.article.id, graph] as const),
    );

    return {
      items: pageRecords.flatMap((record) => {
        const article = articlesById.get(record.articleId);
        return article
          ? [
              {
                articleId: record.articleId,
                bookmarkedAt: record.createdAt,
                article: toArticleGraphOutput(article),
              },
            ]
          : [];
      }),
      page: pagination.page,
      limit: pagination.limit,
      hasMore: records.length > pagination.limit,
    };
  }

  private parsePagination(input: ListBookmarksInput) {
    try {
      return parsePagination(input);
    } catch {
      throw new BookmarkUseCaseError(
        BookmarkFailureReason.InvalidInput,
        'Pagination input is invalid',
      );
    }
  }
}

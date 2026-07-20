import { ArticleGraphOutput } from '@repo/academic/domain';

export interface ListBookmarksInput {
  userId: string;
  page?: unknown;
  limit?: unknown;
}

export interface BookmarkListItemOutput {
  articleId: string;
  bookmarkedAt: Date;
  article: ArticleGraphOutput;
}

export interface ListBookmarksOutput {
  items: BookmarkListItemOutput[];
  page: number;
  limit: number;
  hasMore: boolean;
}

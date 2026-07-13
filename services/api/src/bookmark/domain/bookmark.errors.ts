export enum BookmarkFailureReason {
  InvalidInput = 'INVALID_INPUT',
  ArticleMissing = 'ARTICLE_MISSING',
}

export class BookmarkUseCaseError extends Error {
  constructor(
    readonly reason: BookmarkFailureReason,
    message = 'Bookmark request failed',
  ) {
    super(message);
  }
}

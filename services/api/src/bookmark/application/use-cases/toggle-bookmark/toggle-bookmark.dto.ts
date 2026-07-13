export interface ToggleBookmarkInput {
  userId: string;
  articleId: unknown;
}

export interface ToggleBookmarkOutput {
  articleId: string;
  bookmarked: boolean;
  bookmarkedAt?: Date;
}

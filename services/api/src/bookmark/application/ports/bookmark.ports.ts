export interface BookmarkRecord {
  id: string;
  userId: string;
  articleId: string;
  createdAt: Date;
}

export interface BookmarkRepository {
  countByUser(userId: string): Promise<number>;
  findByUserAndArticle(
    userId: string,
    articleId: string,
  ): Promise<BookmarkRecord | null>;
  create(userId: string, articleId: string): Promise<BookmarkRecord>;
  deleteByUserAndArticle(userId: string, articleId: string): Promise<boolean>;
  listByUser(input: {
    userId: string;
    skip: number;
    take: number;
  }): Promise<BookmarkRecord[]>;
  listArticleIds(): Promise<string[]>;
  deleteByArticleIds(articleIds: string[]): Promise<number>;
}

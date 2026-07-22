import { Injectable } from '@nestjs/common';
import { UserBookmark } from '@prisma/client';
import {
  BookmarkRecord,
  BookmarkRepository,
} from '@/bookmark/application/ports/bookmark.ports';
import { PrismaService } from '@repo/database';

@Injectable()
export class PrismaBookmarkRepository implements BookmarkRepository {
  constructor(private readonly prisma: PrismaService) {}

  countByUser(userId: string): Promise<number> {
    return this.prisma.userBookmark.count({ where: { userId } });
  }

  async findByUserAndArticle(
    userId: string,
    articleId: string,
  ): Promise<BookmarkRecord | null> {
    const bookmark = await this.prisma.userBookmark.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });

    return bookmark ? this.toRecord(bookmark) : null;
  }

  async create(userId: string, articleId: string): Promise<BookmarkRecord> {
    const bookmark = await this.prisma.userBookmark.create({
      data: { userId, articleId },
    });

    return this.toRecord(bookmark);
  }

  async deleteByUserAndArticle(
    userId: string,
    articleId: string,
  ): Promise<boolean> {
    const result = await this.prisma.userBookmark.deleteMany({
      where: { userId, articleId },
    });

    return result.count > 0;
  }

  async listByUser(input: {
    userId: string;
    skip: number;
    take: number;
  }): Promise<BookmarkRecord[]> {
    const bookmarks = await this.prisma.userBookmark.findMany({
      where: { userId: input.userId },
      orderBy: [{ createdAt: 'desc' }],
      skip: input.skip,
      take: input.take,
    });

    return bookmarks.map((bookmark) => this.toRecord(bookmark));
  }

  async listArticleIds(): Promise<string[]> {
    const rows = await this.prisma.userBookmark.findMany({
      distinct: ['articleId'],
      select: { articleId: true },
    });

    return rows.map((row) => row.articleId);
  }

  async deleteByArticleIds(articleIds: string[]): Promise<number> {
    if (articleIds.length === 0) {
      return 0;
    }

    const result = await this.prisma.userBookmark.deleteMany({
      where: { articleId: { in: articleIds } },
    });

    return result.count;
  }

  private toRecord(bookmark: UserBookmark): BookmarkRecord {
    return {
      id: bookmark.id,
      userId: bookmark.userId,
      articleId: bookmark.articleId,
      createdAt: bookmark.createdAt,
    };
  }
}

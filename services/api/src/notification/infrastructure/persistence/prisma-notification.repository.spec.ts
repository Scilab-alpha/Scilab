/* eslint-disable @typescript-eslint/unbound-method */
import { Prisma } from '@prisma/client';
import { PrismaNotificationRepository } from '@/notification/infrastructure/persistence/prisma-notification.repository';
import { PrismaService } from '@repo/database';

const userId = '11111111-1111-4111-8111-111111111111';
const articleId = '22222222-2222-4222-8222-222222222222';
const createdAt = new Date('2026-06-01T00:00:00.000Z');

describe('PrismaNotificationRepository', () => {
  it('creates article notifications directly for atomic dedupe', async () => {
    const prisma = {
      notification: {
        create: jest.fn().mockResolvedValue({
          id: 'notification-1',
          userId,
          title: 'New article',
          message: 'Article title',
          relatedObjectType: 'ARTICLE',
          relatedObjectId: articleId,
          isRead: false,
          createdAt,
          readAt: null,
        }),
      },
    } as unknown as PrismaService;

    await expect(
      new PrismaNotificationRepository(prisma).createForArticleIfNotExists({
        userId,
        articleId,
        title: 'New article',
        message: 'Article title',
      }),
    ).resolves.toMatchObject({
      id: 'notification-1',
      relatedObjectType: 'ARTICLE',
      relatedObjectId: articleId,
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId,
        title: 'New article',
        message: 'Article title',
        relatedObjectType: 'ARTICLE',
        relatedObjectId: articleId,
      },
    });
  });

  it('returns null on unique dedupe races', async () => {
    const prisma = {
      notification: {
        create: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          }),
        ),
      },
    } as unknown as PrismaService;

    await expect(
      new PrismaNotificationRepository(prisma).createForArticleIfNotExists({
        userId,
        articleId,
        title: 'New article',
        message: 'Article title',
      }),
    ).resolves.toBeNull();
  });
});

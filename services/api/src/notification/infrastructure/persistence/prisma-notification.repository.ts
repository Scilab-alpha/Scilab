import { Injectable } from '@nestjs/common';
import {
  Notification,
  NotificationObjectType as PrismaNotificationObjectType,
  Prisma,
} from '@prisma/client';
import {
  CreateNotificationInput,
  NotificationObjectType,
  NotificationRecord,
  NotificationRepository,
} from '@/notification/application/ports/notification.ports';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByUser(input: {
    userId: string;
    isRead?: boolean;
    skip: number;
    take: number;
  }): Promise<NotificationRecord[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: input.userId,
        isRead: input.isRead,
      },
      orderBy: [{ createdAt: 'desc' }],
      skip: input.skip,
      take: input.take,
    });

    return notifications.map((notification) => this.toRecord(notification));
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markRead(
    userId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<NotificationRecord | null> {
    const updated = await this.prisma.notification.updateManyAndReturn({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt },
    });

    return updated[0] ? this.toRecord(updated[0]) : null;
  }

  async markAllRead(userId: string, readAt: Date): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt },
    });

    return result.count;
  }

  async create(input: CreateNotificationInput): Promise<NotificationRecord> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        relatedObjectType: input.relatedObjectType ?? null,
        relatedObjectId: input.relatedObjectId ?? null,
      },
    });

    return this.toRecord(notification);
  }

  async createForArticleIfNotExists(input: {
    userId: string;
    articleId: string;
    title: string;
    message: string;
  }): Promise<NotificationRecord | null> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.title,
          message: input.message,
          relatedObjectType: PrismaNotificationObjectType.ARTICLE,
          relatedObjectId: input.articleId,
        },
      });

      return this.toRecord(notification);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return null;
      }

      throw error;
    }
  }

  async findArticleNotification(input: {
    userId: string;
    articleId: string;
  }): Promise<NotificationRecord | null> {
    const notification = await this.prisma.notification.findUnique({
      where: {
        userId_relatedObjectType_relatedObjectId: {
          userId: input.userId,
          relatedObjectType: PrismaNotificationObjectType.ARTICLE,
          relatedObjectId: input.articleId,
        },
      },
    });

    return notification ? this.toRecord(notification) : null;
  }

  private toRecord(notification: Notification): NotificationRecord {
    return {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      relatedObjectType: notification.relatedObjectType
        ? (String(notification.relatedObjectType) as NotificationObjectType)
        : null,
      relatedObjectId: notification.relatedObjectId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    };
  }
}

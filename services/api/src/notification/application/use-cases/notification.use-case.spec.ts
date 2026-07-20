/* eslint-disable @typescript-eslint/unbound-method */
import { NotificationRepository } from '@/notification/application/ports/notification.ports';
import { GetUnreadCountUseCase } from '@/notification/application/use-cases/get-unread-count/get-unread-count.use-case';
import { ListNotificationsUseCase } from '@/notification/application/use-cases/list-notifications/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '@/notification/application/use-cases/mark-all-notifications-read/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '@/notification/application/use-cases/mark-notification-read/mark-notification-read.use-case';
import { NotificationFailureReason } from '@/notification/domain/notification.errors';

const userId = '11111111-1111-4111-8111-111111111111';
const notificationId = '22222222-2222-4222-8222-222222222222';
const articleId = '33333333-3333-4333-8333-333333333333';
const createdAt = new Date('2026-03-01T00:00:00.000Z');
const readAt = new Date('2026-03-02T00:00:00.000Z');

function createNotificationRepository(): jest.Mocked<NotificationRepository> {
  return {
    listByUser: jest.fn(),
    countUnread: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    create: jest.fn(),
    createForArticleIfNotExists: jest.fn(),
  };
}

describe('Notification use cases', () => {
  it('lists notifications with pagination and read filter', async () => {
    const notifications = createNotificationRepository();
    notifications.listByUser.mockResolvedValue([
      {
        id: notificationId,
        userId,
        title: 'New article',
        message: 'A followed article was published',
        relatedObjectType: 'ARTICLE',
        relatedObjectId: articleId,
        isRead: false,
        createdAt,
        readAt: null,
      },
    ]);

    const result = await new ListNotificationsUseCase(notifications).execute({
      userId,
      page: '1',
      limit: '20',
      isRead: 'false',
    });

    expect(notifications.listByUser).toHaveBeenCalledWith({
      userId,
      isRead: false,
      skip: 0,
      take: 21,
    });
    expect(result.items[0]).toEqual({
      notificationId,
      title: 'New article',
      message: 'A followed article was published',
      relatedObjectType: 'ARTICLE',
      relatedObjectId: articleId,
      isRead: false,
      createdAt,
      readAt: null,
    });
  });

  it('returns unread count', async () => {
    const notifications = createNotificationRepository();
    notifications.countUnread.mockResolvedValue(3);

    await expect(
      new GetUnreadCountUseCase(notifications).execute({ userId }),
    ).resolves.toEqual({ unreadCount: 3 });
  });

  it('marks one current-user notification as read', async () => {
    const notifications = createNotificationRepository();
    notifications.markRead.mockResolvedValue({
      id: notificationId,
      userId,
      title: 'New article',
      message: 'A followed article was published',
      relatedObjectType: 'ARTICLE',
      relatedObjectId: articleId,
      isRead: true,
      createdAt,
      readAt,
    });

    const result = await new MarkNotificationReadUseCase(notifications).execute(
      {
        userId,
        notificationId,
      },
    );

    expect(notifications.markRead).toHaveBeenCalledWith(
      userId,
      notificationId,
      expect.any(Date),
    );
    expect(result).toMatchObject({
      notificationId,
      isRead: true,
      readAt,
    });
  });

  it('marks all current-user notifications as read', async () => {
    const notifications = createNotificationRepository();
    notifications.markAllRead.mockResolvedValue(4);

    await expect(
      new MarkAllNotificationsReadUseCase(notifications).execute({ userId }),
    ).resolves.toEqual({ updatedCount: 4 });
    expect(notifications.markAllRead).toHaveBeenCalledWith(
      userId,
      expect.any(Date),
    );
  });

  it('rejects invalid pagination instead of silently defaulting', async () => {
    const notifications = createNotificationRepository();

    await expect(
      new ListNotificationsUseCase(notifications).execute({
        userId,
        page: 'abc',
        limit: '20',
      }),
    ).rejects.toMatchObject({
      reason: NotificationFailureReason.InvalidInput,
    });
    expect(notifications.listByUser).not.toHaveBeenCalled();
  });
});

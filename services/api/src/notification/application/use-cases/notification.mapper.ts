import { NotificationRecord } from '@/notification/application/ports/notification.ports';
import { NotificationOutput } from '@/notification/application/use-cases/list-notifications/list-notifications.dto';

export function toNotificationOutput(
  notification: NotificationRecord,
): NotificationOutput {
  return {
    notificationId: notification.id,
    title: notification.title,
    message: notification.message,
    relatedObjectType: notification.relatedObjectType,
    relatedObjectId: notification.relatedObjectId,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
  };
}

import { NotificationRepository } from '@/notification/application/ports/notification.ports';
import {
  MarkNotificationReadInput,
  MarkNotificationReadOutput,
} from '@/notification/application/use-cases/mark-notification-read/mark-notification-read.dto';
import { toNotificationOutput } from '@/notification/application/use-cases/notification.mapper';
import {
  NotificationFailureReason,
  NotificationUseCaseError,
} from '@/notification/domain/notification.errors';

export class MarkNotificationReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(
    input: MarkNotificationReadInput,
  ): Promise<MarkNotificationReadOutput> {
    const notificationId = input.notificationId as string;
    const notification = await this.notifications.markRead(
      input.userId,
      notificationId,
      new Date(),
    );

    if (!notification) {
      throw new NotificationUseCaseError(
        NotificationFailureReason.NotificationMissing,
        'Notification not found',
      );
    }

    return toNotificationOutput(notification);
  }
}

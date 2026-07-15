import { NotificationRepository } from '@/notification/application/ports/notification.ports';
import {
  MarkAllNotificationsReadInput,
  MarkAllNotificationsReadOutput,
} from '@/notification/application/use-cases/mark-all-notifications-read/mark-all-notifications-read.dto';

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(
    input: MarkAllNotificationsReadInput,
  ): Promise<MarkAllNotificationsReadOutput> {
    return {
      updatedCount: await this.notifications.markAllRead(
        input.userId,
        new Date(),
      ),
    };
  }
}

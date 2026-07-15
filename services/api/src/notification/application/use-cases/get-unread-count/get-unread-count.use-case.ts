import { NotificationRepository } from '@/notification/application/ports/notification.ports';
import {
  GetUnreadCountInput,
  GetUnreadCountOutput,
} from '@/notification/application/use-cases/get-unread-count/get-unread-count.dto';

export class GetUnreadCountUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(input: GetUnreadCountInput): Promise<GetUnreadCountOutput> {
    return {
      unreadCount: await this.notifications.countUnread(input.userId),
    };
  }
}

import { NotificationRepository } from '@/notification/application/ports/notification.ports';
import {
  ListNotificationsInput,
  ListNotificationsOutput,
} from '@/notification/application/use-cases/list-notifications/list-notifications.dto';
import { toNotificationOutput } from '@/notification/application/use-cases/notification.mapper';
import {
  NotificationFailureReason,
  NotificationUseCaseError,
} from '@/notification/domain/notification.errors';
import {
  parseOptionalBoolean,
  parsePagination,
} from '@/shared/validation/request-input';

export class ListNotificationsUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(
    input: ListNotificationsInput,
  ): Promise<ListNotificationsOutput> {
    const pagination = this.parsePagination(input);
    const isRead = this.parseReadFilter(input.isRead);
    const records = await this.notifications.listByUser({
      userId: input.userId,
      isRead,
      skip: pagination.skip,
      take: pagination.take,
    });

    return {
      items: records.slice(0, pagination.limit).map(toNotificationOutput),
      page: pagination.page,
      limit: pagination.limit,
      hasMore: records.length > pagination.limit,
    };
  }

  private parseReadFilter(value: unknown): boolean | undefined {
    try {
      return parseOptionalBoolean(value);
    } catch {
      throw new NotificationUseCaseError(
        NotificationFailureReason.InvalidInput,
        'isRead is invalid',
      );
    }
  }

  private parsePagination(input: ListNotificationsInput) {
    try {
      return parsePagination(input);
    } catch {
      throw new NotificationUseCaseError(
        NotificationFailureReason.InvalidInput,
        'Pagination input is invalid',
      );
    }
  }
}

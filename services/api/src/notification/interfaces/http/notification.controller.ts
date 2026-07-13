import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '@/auth/application/ports/auth.ports';
import { CurrentUser } from '@/auth/interfaces/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/interfaces/guards/jwt-auth.guard';
import { UserEventsService } from '@/events/application/user-events.service';
import { GetUnreadCountUseCase } from '@/notification/application/use-cases/get-unread-count/get-unread-count.use-case';
import { ListNotificationsUseCase } from '@/notification/application/use-cases/list-notifications/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '@/notification/application/use-cases/mark-all-notifications-read/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '@/notification/application/use-cases/mark-notification-read/mark-notification-read.use-case';
import {
  NotificationFailureReason,
  NotificationUseCaseError,
} from '@/notification/domain/notification.errors';
import { NotificationQueryDto } from '@/notification/interfaces/http/notification.dto';
import {
  ApiListNotifications,
  ApiMarkAllNotificationsRead,
  ApiMarkNotificationRead,
  ApiUnreadNotificationCount,
} from '@/notification/interfaces/http/notification.swagger';
import { createSuccessResponse } from '@/shared/response/response.factory';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly getUnreadCount: GetUnreadCountUseCase,
    private readonly markNotificationRead: MarkNotificationReadUseCase,
    private readonly markAllNotificationsRead: MarkAllNotificationsReadUseCase,
    private readonly events: UserEventsService,
  ) {}

  @Get()
  @ApiListNotifications()
  async list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: NotificationQueryDto,
  ) {
    try {
      const result = await this.listNotifications.execute({
        userId: currentUser.userId,
        page: query.page,
        limit: query.limit,
        isRead: query.isRead,
      });
      return createSuccessResponse(result, 'Notifications retrieved');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Get('unread-count')
  @ApiUnreadNotificationCount()
  async unreadCount(@CurrentUser() currentUser: AuthenticatedUser) {
    const result = await this.getUnreadCount.execute({
      userId: currentUser.userId,
    });
    return createSuccessResponse(result, 'Unread notification count retrieved');
  }

  @Patch(':notificationId/read')
  @ApiMarkNotificationRead()
  async markRead(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('notificationId') notificationId: string,
  ) {
    try {
      const result = await this.markNotificationRead.execute({
        userId: currentUser.userId,
        notificationId,
      });
      this.events.emit(currentUser.userId, 'notification.read', result);
      return createSuccessResponse(result, 'Notification marked as read');
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  @Patch('read-all')
  @ApiMarkAllNotificationsRead()
  async markAllRead(@CurrentUser() currentUser: AuthenticatedUser) {
    const result = await this.markAllNotificationsRead.execute({
      userId: currentUser.userId,
    });
    this.events.emit(currentUser.userId, 'notification.read_all', result);
    return createSuccessResponse(result, 'Notifications marked as read');
  }

  private toHttpException(error: unknown) {
    if (error instanceof NotificationUseCaseError) {
      if (error.reason === NotificationFailureReason.InvalidInput) {
        return new BadRequestException(error.message);
      }

      if (error.reason === NotificationFailureReason.NotificationMissing) {
        return new NotFoundException(error.message);
      }
    }

    return new InternalServerErrorException('Notification request failed');
  }
}

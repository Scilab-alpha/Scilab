import { Module } from '@nestjs/common';
import { AcademicHttpModule } from '@/academic/academic-http.module';
import { AuthModule } from '@/auth/auth.module';
import { EventsModule } from '@/events/events.module';
import { FollowModule } from '@/follow/follow.module';
import { GetUnreadCountUseCase } from '@/notification/application/use-cases/get-unread-count/get-unread-count.use-case';
import { ListNotificationsUseCase } from '@/notification/application/use-cases/list-notifications/list-notifications.use-case';
import { MarkAllNotificationsReadUseCase } from '@/notification/application/use-cases/mark-all-notifications-read/mark-all-notifications-read.use-case';
import { MarkNotificationReadUseCase } from '@/notification/application/use-cases/mark-notification-read/mark-notification-read.use-case';
import { AlertDispatchService } from '@/notification/application/services/alert-dispatch.service';
import { NoopEmailDigestPort } from '@/notification/infrastructure/email/noop-email-digest.port';
import { PrismaNotificationRepository } from '@/notification/infrastructure/persistence/prisma-notification.repository';
import { NotificationController } from '@/notification/interfaces/http/notification.controller';
import { PrismaModule } from '@repo/database';
import { PushModule } from '@/push/push.module';

@Module({
  imports: [
    PrismaModule,
    AcademicHttpModule,
    AuthModule,
    FollowModule,
    EventsModule,
    PushModule,
  ],
  controllers: [NotificationController],
  providers: [
    PrismaNotificationRepository,
    NoopEmailDigestPort,
    AlertDispatchService,
    {
      provide: ListNotificationsUseCase,
      useFactory: (notifications: PrismaNotificationRepository) =>
        new ListNotificationsUseCase(notifications),
      inject: [PrismaNotificationRepository],
    },
    {
      provide: GetUnreadCountUseCase,
      useFactory: (notifications: PrismaNotificationRepository) =>
        new GetUnreadCountUseCase(notifications),
      inject: [PrismaNotificationRepository],
    },
    {
      provide: MarkNotificationReadUseCase,
      useFactory: (notifications: PrismaNotificationRepository) =>
        new MarkNotificationReadUseCase(notifications),
      inject: [PrismaNotificationRepository],
    },
    {
      provide: MarkAllNotificationsReadUseCase,
      useFactory: (notifications: PrismaNotificationRepository) =>
        new MarkAllNotificationsReadUseCase(notifications),
      inject: [PrismaNotificationRepository],
    },
  ],
  exports: [PrismaNotificationRepository],
})
export class NotificationModule {}

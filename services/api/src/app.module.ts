import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AcademicHttpModule } from '@/academic/academic-http.module';
import { AdminAcademicModule } from '@/admin/admin-academic.module';
import { AuthModule } from '@/auth/auth.module';
import { BookmarkModule } from '@/bookmark/bookmark.module';
import { DashboardModule } from '@/dashboard/dashboard.module';
import { EventsModule } from '@/events/events.module';
import { FollowModule } from '@/follow/follow.module';
import { Neo4jModule } from '@repo/neo4j';
import { NotificationModule } from '@/notification/notification.module';
import { PrismaModule } from '@repo/database';
import { PushModule } from '@/push/push.module';
import { UserModule } from '@/user/user.module';
import { VisualizeModule } from '@/visualize/visualize.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    Neo4jModule,
    AcademicHttpModule,
    AdminAcademicModule,
    VisualizeModule,
    AuthModule,
    UserModule,
    EventsModule,
    FollowModule,
    BookmarkModule,
    DashboardModule,
    PushModule,
    NotificationModule,
  ],
})
export class AppModule {}

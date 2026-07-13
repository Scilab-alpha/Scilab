import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AcademicModule } from '@/academic/academic.module';
import { AuthModule } from '@/auth/auth.module';
import { EventsModule } from '@/events/events.module';
import { FollowModule } from '@/follow/follow.module';
import { Neo4jModule } from '@/neo4j/neo4j.module';
import { NotificationModule } from '@/notification/notification.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { PushModule } from '@/push/push.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    Neo4jModule,
    AcademicModule,
    AuthModule,
    UserModule,
    EventsModule,
    FollowModule,
    PushModule,
    NotificationModule,
  ],
})
export class AppModule {}

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AcademicModule } from '@/academic/academic.module';
import { AuthModule } from '@/auth/auth.module';
import { Neo4jModule } from '@/neo4j/neo4j.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { UserModule } from '@/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ...(isAcademicWorker() ? [] : [ScheduleModule.forRoot()]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'redis',
          port: Number(config.get<string>('REDIS_PORT') ?? '6379'),
          password: config.get<string>('REDIS_PASSWORD'),
          db: Number(config.get<string>('REDIS_DB') ?? '0'),
          maxRetriesPerRequest: null,
        },
        prefix: config.get<string>('BULLMQ_PREFIX') ?? 'scilab',
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: { age: 60 * 60 * 24 * 7, count: 1_000 },
          removeOnFail: { age: 60 * 60 * 24 * 30 },
        },
      }),
    }),
    PrismaModule,
    Neo4jModule,
    AcademicModule,
    AuthModule,
    UserModule,
  ],
})
export class AppModule {}

function isAcademicWorker(): boolean {
  return process.env.ACADEMIC_WORKER_MODE === 'true';
}

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ACADEMIC_PIPELINE_QUEUE_NAMES,
  AcademicPipelineQueueProducer,
  createBullMqConnection,
} from '@repo/academic-queue';
import { PrismaModule } from '@repo/database';
import { Neo4jModule } from '@repo/neo4j';
import { AuthModule } from '@/auth/auth.module';
import { AdminAcademicService } from '@/admin/application/admin-academic.service';
import { AdminAcademicController } from '@/admin/interfaces/http/admin-academic.controller';
import { AdminGuard } from '@/user/interfaces/guards/admin.guard';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    PrismaModule,
    Neo4jModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createBullMqConnection,
    }),
    BullModule.registerQueue(
      ...ACADEMIC_PIPELINE_QUEUE_NAMES.map((name) => ({ name })),
    ),
  ],
  controllers: [AdminAcademicController],
  providers: [AdminGuard, AcademicPipelineQueueProducer, AdminAcademicService],
})
export class AdminAcademicModule {}

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import {
  ACADEMIC_PIPELINE_QUEUE_NAMES,
  AcademicPipelineQueueProducer,
  createBullMqConnection,
} from '@repo/academic-queue';
import { AcademicPipelineScheduler } from './academic-pipeline.scheduler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createBullMqConnection,
    }),
    BullModule.registerQueue(
      ...ACADEMIC_PIPELINE_QUEUE_NAMES.map((name) => ({ name })),
    ),
  ],
  providers: [AcademicPipelineQueueProducer, AcademicPipelineScheduler],
})
export class AppModule {}

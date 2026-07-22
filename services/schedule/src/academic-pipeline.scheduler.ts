import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  ACADEMIC_PIPELINE_JOB_DEFINITIONS,
  ACADEMIC_PIPELINE_QUEUES,
  AcademicPipelineQueueProducer,
} from '@repo/academic-queue';
import { PrismaService } from '@repo/database';

@Injectable()
export class AcademicPipelineScheduler {
  private readonly logger = new Logger(AcademicPipelineScheduler.name);

  constructor(
    private readonly queues: AcademicPipelineQueueProducer,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[ACADEMIC_PIPELINE_QUEUES.scimagoReload]
      .cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.scimagoReload
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.scimagoReload
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueScimagoReload(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.scimagoReload);
  }

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[
      ACADEMIC_PIPELINE_QUEUES.journalSourceSync
    ].cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.journalSourceSync
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.journalSourceSync
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueJournalSourceSync(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.journalSourceSync);
  }

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[
      ACADEMIC_PIPELINE_QUEUES.journalArticleSync
    ].cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.journalArticleSync
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.journalArticleSync
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueJournalArticleSync(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.journalArticleSync);
  }

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[ACADEMIC_PIPELINE_QUEUES.relatedWorkSync]
      .cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.relatedWorkSync
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.relatedWorkSync
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueRelatedWorkSync(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.relatedWorkSync);
  }

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[
      ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration
    ].cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueRelatedWorkHydration(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration);
  }

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[
      ACADEMIC_PIPELINE_QUEUES.outgoingReference
    ].cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.outgoingReference
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.outgoingReference
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueOutgoingReference(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.outgoingReference);
  }

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[
      ACADEMIC_PIPELINE_QUEUES.referenceHydration
    ].cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.referenceHydration
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.referenceHydration
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueReferenceHydration(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.referenceHydration);
  }

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[ACADEMIC_PIPELINE_QUEUES.incomingCitation]
      .cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.incomingCitation
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.incomingCitation
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueIncomingCitation(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.incomingCitation);
  }

  @Cron(
    ACADEMIC_PIPELINE_JOB_DEFINITIONS[
      ACADEMIC_PIPELINE_QUEUES.citationCountRefresh
    ].cron,
    {
      name: ACADEMIC_PIPELINE_JOB_DEFINITIONS[
        ACADEMIC_PIPELINE_QUEUES.citationCountRefresh
      ].schedulerName,
      timeZone:
        ACADEMIC_PIPELINE_JOB_DEFINITIONS[
          ACADEMIC_PIPELINE_QUEUES.citationCountRefresh
        ].timeZone,
      waitForCompletion: true,
    },
  )
  async enqueueCitationCountRefresh(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.citationCountRefresh);
  }

  private async enqueue(
    queueName: (typeof ACADEMIC_PIPELINE_QUEUES)[keyof typeof ACADEMIC_PIPELINE_QUEUES],
  ): Promise<void> {
    const control = await this.prisma.academicJobControl.findUnique({
      where: { jobId: queueName },
    });
    if (control?.isPaused) {
      this.logger.log(`Skipped ${queueName}; scheduler is paused.`);
      return;
    }

    const scheduledAt = new Date();
    const run = await this.prisma.academicJobRun.create({
      data: {
        jobId: queueName,
        trigger: 'CRON' as never,
        status: 'WAITING' as never,
        scheduledAt,
      },
    });
    try {
      const bullJobId = await this.queues.enqueue(queueName, scheduledAt, {
        runId: run.id,
        trigger: 'CRON',
      });
      await this.prisma.academicJobRun.update({
        where: { id: run.id },
        data: { bullJobId },
      });
      this.logger.log(`Enqueued ${queueName} job ${bullJobId}.`);
    } catch (error) {
      await this.prisma.academicJobRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED' as never,
          finishedAt: new Date(),
          errorDetail:
            error instanceof Error ? error.message : 'Queue enqueue failed',
        },
      });
      throw error;
    }
  }
}

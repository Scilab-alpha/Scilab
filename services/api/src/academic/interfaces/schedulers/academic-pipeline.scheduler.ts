import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  ACADEMIC_PIPELINE_QUEUES,
  AcademicPipelineQueueProducer,
} from '@/academic/infrastructure/queue/academic-pipeline.queue';

const TIME_ZONE = 'Asia/Bangkok';

@Injectable()
export class AcademicPipelineScheduler {
  private readonly logger = new Logger(AcademicPipelineScheduler.name);

  constructor(private readonly queues: AcademicPipelineQueueProducer) {}

  @Cron('0 0 2 * * *', {
    name: 'scimago-reload-producer',
    timeZone: TIME_ZONE,
    waitForCompletion: true,
  })
  async enqueueScimagoReload(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.scimagoReload);
  }

  @Cron('0 15 2 * * *', {
    name: 'journal-source-sync-producer',
    timeZone: TIME_ZONE,
    waitForCompletion: true,
  })
  async enqueueJournalSourceSync(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.journalSourceSync);
  }

  @Cron('0 0 4 * * *', {
    name: 'journal-article-sync-producer',
    timeZone: TIME_ZONE,
    waitForCompletion: true,
  })
  async enqueueJournalArticleSync(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.journalArticleSync);
  }

  @Cron('0 0 6 * * *', {
    name: 'outgoing-reference-producer',
    timeZone: TIME_ZONE,
    waitForCompletion: true,
  })
  async enqueueOutgoingReference(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.outgoingReference);
  }

  @Cron('0 0 7 * * *', {
    name: 'reference-hydration-producer',
    timeZone: TIME_ZONE,
    waitForCompletion: true,
  })
  async enqueueReferenceHydration(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.referenceHydration);
  }

  @Cron('0 0 8 * * *', {
    name: 'incoming-citation-producer',
    timeZone: TIME_ZONE,
    waitForCompletion: true,
  })
  async enqueueIncomingCitation(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.incomingCitation);
  }

  @Cron('0 0 */6 * * *', {
    name: 'citation-count-refresh-producer',
    timeZone: TIME_ZONE,
    waitForCompletion: true,
  })
  async enqueueCitationCountRefresh(): Promise<void> {
    await this.enqueue(ACADEMIC_PIPELINE_QUEUES.citationCountRefresh);
  }

  private async enqueue(
    queueName: (typeof ACADEMIC_PIPELINE_QUEUES)[keyof typeof ACADEMIC_PIPELINE_QUEUES],
  ): Promise<void> {
    const jobId = await this.queues.enqueue(queueName, new Date());
    this.logger.log(`Enqueued ${queueName} job ${jobId}.`);
  }
}

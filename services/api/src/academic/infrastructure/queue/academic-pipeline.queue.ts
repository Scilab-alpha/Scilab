import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

export const ACADEMIC_PIPELINE_QUEUES = {
  scimagoReload: 'scimago-reload',
  journalSourceSync: 'journal-source-sync',
  journalArticleSync: 'journal-article-sync',
  outgoingReference: 'outgoing-reference',
  referenceHydration: 'reference-hydration',
  incomingCitation: 'incoming-citation',
  citationCountRefresh: 'citation-count-refresh',
} as const;

type AcademicPipelineQueueName =
  (typeof ACADEMIC_PIPELINE_QUEUES)[keyof typeof ACADEMIC_PIPELINE_QUEUES];

@Injectable()
export class AcademicPipelineQueueProducer {
  private readonly queues: Record<AcademicPipelineQueueName, Queue>;

  constructor(
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.scimagoReload)
    scimagoReload: Queue,
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.journalSourceSync)
    journalSourceSync: Queue,
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.journalArticleSync)
    journalArticleSync: Queue,
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.outgoingReference)
    outgoingReference: Queue,
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.referenceHydration)
    referenceHydration: Queue,
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.incomingCitation)
    incomingCitation: Queue,
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.citationCountRefresh)
    citationCountRefresh: Queue,
  ) {
    this.queues = {
      [ACADEMIC_PIPELINE_QUEUES.scimagoReload]: scimagoReload,
      [ACADEMIC_PIPELINE_QUEUES.journalSourceSync]: journalSourceSync,
      [ACADEMIC_PIPELINE_QUEUES.journalArticleSync]: journalArticleSync,
      [ACADEMIC_PIPELINE_QUEUES.outgoingReference]: outgoingReference,
      [ACADEMIC_PIPELINE_QUEUES.referenceHydration]: referenceHydration,
      [ACADEMIC_PIPELINE_QUEUES.incomingCitation]: incomingCitation,
      [ACADEMIC_PIPELINE_QUEUES.citationCountRefresh]: citationCountRefresh,
    };
  }

  async enqueue(
    queueName: AcademicPipelineQueueName,
    scheduledAt: Date,
  ): Promise<string> {
    const job = await this.queues[queueName].add(
      'run',
      { scheduledAt: scheduledAt.toISOString() },
      { jobId: `${queueName}-${formatJobId(scheduledAt)}` },
    );

    return String(job.id);
  }
}

function formatJobId(value: Date): string {
  return value.toISOString().replace(/[-:.TZ]/gu, '');
}

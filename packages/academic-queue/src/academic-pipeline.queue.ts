import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JobsOptions, Queue } from 'bullmq';

export const ACADEMIC_PIPELINE_QUEUES = {
  scimagoReload: 'scimago-reload',
  journalSourceSync: 'journal-source-sync',
  journalArticleSync: 'journal-article-sync',
  relatedWorkSync: 'related-work-sync',
  relatedWorkHydration: 'related-work-hydration',
  outgoingReference: 'outgoing-reference',
  referenceHydration: 'reference-hydration',
  incomingCitation: 'incoming-citation',
  citationCountRefresh: 'citation-count-refresh',
} as const;

export type AcademicPipelineQueueName =
  (typeof ACADEMIC_PIPELINE_QUEUES)[keyof typeof ACADEMIC_PIPELINE_QUEUES];

export const ACADEMIC_PIPELINE_QUEUE_NAMES = Object.values(
  ACADEMIC_PIPELINE_QUEUES,
) as AcademicPipelineQueueName[];

export interface AcademicPipelineJobDataV1 {
  schemaVersion: 1;
  scheduledAt: string;
}

export interface LegacyAcademicPipelineJobData {
  scheduledAt: string;
}

export type AcademicPipelineJobData =
  | AcademicPipelineJobDataV1
  | LegacyAcademicPipelineJobData;

export function createBullMqConnection(config: ConfigService) {
  return {
    connection: {
      host: config.get<string>('REDIS_HOST') ?? 'redis',
      port: Number(config.get<string>('REDIS_PORT') ?? '6379'),
      password: config.get<string>('REDIS_PASSWORD'),
      db: Number(config.get<string>('REDIS_DB') ?? '0'),
      maxRetriesPerRequest: null,
    },
    prefix: config.get<string>('BULLMQ_PREFIX') ?? 'scilab',
    defaultJobOptions: ACADEMIC_PIPELINE_JOB_OPTIONS,
  };
}

export const ACADEMIC_PIPELINE_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 30_000 },
  removeOnComplete: { age: 60 * 60 * 24 * 7, count: 1_000 },
  removeOnFail: { age: 60 * 60 * 24 * 30 },
};

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
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.relatedWorkSync)
    relatedWorkSync: Queue,
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration)
    relatedWorkHydration: Queue,
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
      [ACADEMIC_PIPELINE_QUEUES.relatedWorkSync]: relatedWorkSync,
      [ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration]: relatedWorkHydration,
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
      {
        schemaVersion: 1,
        scheduledAt: normalizeScheduleSlot(scheduledAt).toISOString(),
      },
      {
        jobId: `${queueName}-${formatJobId(normalizeScheduleSlot(scheduledAt))}`,
      },
    );

    return String(job.id);
  }
}

function formatJobId(value: Date): string {
  return value
    .toISOString()
    .replace(/[-:.TZ]/gu, '')
    .slice(0, 12);
}

function normalizeScheduleSlot(value: Date): Date {
  const slot = new Date(value);
  slot.setUTCSeconds(0, 0);
  return slot;
}

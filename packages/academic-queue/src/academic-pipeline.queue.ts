import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JobsOptions, Queue } from 'bullmq';

export const ACADEMIC_PIPELINE_QUEUES = {
  scimagoReload: 'scimago-reload',
  journalSourceSync: 'journal-source-sync',
  journalArticleSync: 'journal-article-sync',
  semanticScholarJournalSupplement: 'semantic-scholar-journal-supplement',
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

export type AcademicPipelineTrigger = 'CRON' | 'MANUAL' | 'RETRY';

export interface AcademicPipelineJobDefinition {
  id: AcademicPipelineQueueName;
  displayName: string;
  cron: string;
  schedulerName: string;
  timeZone: string;
  source: 'OPENALEX' | 'SCIMAGO' | 'SEMANTIC_SCHOLAR';
  dataType: string;
}

const TIME_ZONE = 'Asia/Bangkok';

export const ACADEMIC_PIPELINE_JOB_DEFINITIONS: Record<
  AcademicPipelineQueueName,
  AcademicPipelineJobDefinition
> = {
  [ACADEMIC_PIPELINE_QUEUES.scimagoReload]: {
    id: ACADEMIC_PIPELINE_QUEUES.scimagoReload,
    displayName: 'SCImago catalog reload',
    cron: '0 0 2 * * *',
    schedulerName: 'scimago-reload-producer',
    timeZone: TIME_ZONE,
    source: 'SCIMAGO',
    dataType: 'SCIMAGO_RELOAD',
  },
  [ACADEMIC_PIPELINE_QUEUES.journalSourceSync]: {
    id: ACADEMIC_PIPELINE_QUEUES.journalSourceSync,
    displayName: 'Journal source synchronization',
    cron: '0 15 2 * * *',
    schedulerName: 'journal-source-sync-producer',
    timeZone: TIME_ZONE,
    source: 'OPENALEX',
    dataType: 'JOURNAL_SOURCE_SYNC',
  },
  [ACADEMIC_PIPELINE_QUEUES.journalArticleSync]: {
    id: ACADEMIC_PIPELINE_QUEUES.journalArticleSync,
    displayName: 'Journal article synchronization',
    cron: '0 0 4 * * *',
    schedulerName: 'journal-article-sync-producer',
    timeZone: TIME_ZONE,
    source: 'OPENALEX',
    dataType: 'JOURNAL_ARTICLE_SYNC',
  },
  [ACADEMIC_PIPELINE_QUEUES.semanticScholarJournalSupplement]: {
    id: ACADEMIC_PIPELINE_QUEUES.semanticScholarJournalSupplement,
    displayName: 'Semantic Scholar journal supplementation',
    cron: '0 30 4 * * *',
    schedulerName: 'semantic-scholar-journal-supplement-producer',
    timeZone: TIME_ZONE,
    source: 'SEMANTIC_SCHOLAR',
    dataType: 'SEMANTIC_SCHOLAR_JOURNAL_SUPPLEMENT',
  },
  [ACADEMIC_PIPELINE_QUEUES.relatedWorkSync]: {
    id: ACADEMIC_PIPELINE_QUEUES.relatedWorkSync,
    displayName: 'Related-work synchronization',
    cron: '0 0 5 * * *',
    schedulerName: 'related-work-sync-producer',
    timeZone: TIME_ZONE,
    source: 'OPENALEX',
    dataType: 'RELATED_WORK_SYNC',
  },
  [ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration]: {
    id: ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration,
    displayName: 'Related-work hydration',
    cron: '0 30 5 * * *',
    schedulerName: 'related-work-hydration-producer',
    timeZone: TIME_ZONE,
    source: 'OPENALEX',
    dataType: 'RELATED_WORK_HYDRATION',
  },
  [ACADEMIC_PIPELINE_QUEUES.outgoingReference]: {
    id: ACADEMIC_PIPELINE_QUEUES.outgoingReference,
    displayName: 'Outgoing reference crawl',
    cron: '0 0 6 * * *',
    schedulerName: 'outgoing-reference-producer',
    timeZone: TIME_ZONE,
    source: 'OPENALEX',
    dataType: 'OUTGOING_REFERENCE_CRAWL',
  },
  [ACADEMIC_PIPELINE_QUEUES.referenceHydration]: {
    id: ACADEMIC_PIPELINE_QUEUES.referenceHydration,
    displayName: 'Reference hydration',
    cron: '0 0 7 * * *',
    schedulerName: 'reference-hydration-producer',
    timeZone: TIME_ZONE,
    source: 'OPENALEX',
    dataType: 'REFERENCE_HYDRATION',
  },
  [ACADEMIC_PIPELINE_QUEUES.incomingCitation]: {
    id: ACADEMIC_PIPELINE_QUEUES.incomingCitation,
    displayName: 'Incoming citation crawl',
    cron: '0 0 8 * * *',
    schedulerName: 'incoming-citation-producer',
    timeZone: TIME_ZONE,
    source: 'OPENALEX',
    dataType: 'INCOMING_CITATION_CRAWL',
  },
  [ACADEMIC_PIPELINE_QUEUES.citationCountRefresh]: {
    id: ACADEMIC_PIPELINE_QUEUES.citationCountRefresh,
    displayName: 'Citation-count refresh',
    cron: '0 0 */6 * * *',
    schedulerName: 'citation-count-refresh-producer',
    timeZone: TIME_ZONE,
    source: 'OPENALEX',
    dataType: 'CITATION_COUNT_REFRESH',
  },
};

export interface AcademicPipelineJobDataV1 {
  schemaVersion: 1;
  scheduledAt: string;
}

export interface AcademicPipelineJobDataV2 {
  schemaVersion: 2;
  scheduledAt: string;
  runId: string;
  trigger: AcademicPipelineTrigger;
  retriedFromRunId?: string;
}

export interface LegacyAcademicPipelineJobData {
  scheduledAt: string;
}

export type AcademicPipelineJobData =
  | AcademicPipelineJobDataV2
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
    @InjectQueue(ACADEMIC_PIPELINE_QUEUES.semanticScholarJournalSupplement)
    semanticScholarJournalSupplement: Queue,
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
      [ACADEMIC_PIPELINE_QUEUES.semanticScholarJournalSupplement]:
        semanticScholarJournalSupplement,
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
    metadata?: {
      runId: string;
      trigger: AcademicPipelineTrigger;
      retriedFromRunId?: string;
    },
  ): Promise<string> {
    const normalizedScheduledAt = normalizeScheduleSlot(scheduledAt);
    const job = await this.queues[queueName].add(
      'run',
      metadata
        ? {
            schemaVersion: 2,
            scheduledAt: normalizedScheduledAt.toISOString(),
            runId: metadata.runId,
            trigger: metadata.trigger,
            ...(metadata.retriedFromRunId
              ? { retriedFromRunId: metadata.retriedFromRunId }
              : {}),
          }
        : {
            schemaVersion: 1,
            scheduledAt: normalizedScheduledAt.toISOString(),
          },
      {
        jobId:
          metadata?.runId ??
          `${queueName}-${formatJobId(normalizedScheduledAt)}`,
      },
    );

    return String(job.id);
  }

  getQueue(queueName: AcademicPipelineQueueName): Queue {
    return this.queues[queueName];
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

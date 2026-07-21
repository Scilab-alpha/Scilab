import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import {
  CrawlIncomingCitationsUseCase,
  CrawlOutgoingReferencesUseCase,
  HydrateReferencedWorksUseCase,
  HydrateRelatedWorksUseCase,
  RefreshCitationCountsUseCase,
  ReloadScimagoDatasetUseCase,
  ResolveScimagoJournalsUseCase,
  RunJournalArticleSyncPipelineUseCase,
  SupplementJournalsWithSemanticScholarUseCase,
  SyncRelatedWorksUseCase,
} from '@repo/academic/sync';
import { PipelineExecutionControl } from '@repo/academic/domain';
import {
  OpenAlexEnvConfigReader,
  SemanticScholarEnvConfigReader,
  PrismaAcademicSyncLogRepository,
} from '@repo/academic/adapters';
import {
  ACADEMIC_PIPELINE_JOB_DEFINITIONS,
  ACADEMIC_PIPELINE_QUEUES,
  type AcademicPipelineJobData,
  type AcademicPipelineQueueName,
} from '@repo/academic-queue';
import { PrismaService } from '@repo/database';

type PipelineJobData = AcademicPipelineJobData;

@Injectable()
export class AcademicPipelineJobRunner {
  constructor(
    private readonly logs: PrismaAcademicSyncLogRepository,
    private readonly openAlexConfig: OpenAlexEnvConfigReader,
    private readonly semanticScholarConfig: SemanticScholarEnvConfigReader,
    private readonly prisma: PrismaService,
  ) {}

  async run<T>(
    context: {
      type:
        | 'SCIMAGO_RELOAD'
        | 'JOURNAL_SOURCE_SYNC'
        | 'JOURNAL_ARTICLE_SYNC'
        | 'RELATED_WORK_SYNC'
        | 'RELATED_WORK_HYDRATION'
        | 'OUTGOING_REFERENCE_CRAWL'
        | 'REFERENCE_HYDRATION'
        | 'INCOMING_CITATION_CRAWL'
        | 'CITATION_COUNT_REFRESH'
        | 'SEMANTIC_SCHOLAR_JOURNAL_SUPPLEMENT';
      source: 'OPENALEX' | 'SCIMAGO' | 'SEMANTIC_SCHOLAR';
    },
    job: Job<PipelineJobData>,
    task: (control: PipelineExecutionControl) => Promise<T>,
    counters: (result: T) => {
      fetched: number;
      inserted: number;
      updated: number;
    },
  ): Promise<T> {
    let runId = isPipelineJobDataV2(job.data) ? job.data.runId : undefined;
    const config = this.openAlexConfig.getOpenAlexConfig();
    if (runId) {
      await this.prisma.academicJobRun.update({
        where: { id: runId },
        data: {
          status: 'RUNNING' as never,
          startedAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
    } else {
      const jobId = queueNameFor(context.type);
      const scheduledAt = new Date(job.data.scheduledAt);
      const legacyRun = await this.prisma.academicJobRun.upsert({
        where: { bullJobId: String(job.id) },
        update: {
          status: 'RUNNING' as never,
          startedAt: new Date(),
          attemptCount: { increment: 1 },
        },
        create: {
          jobId,
          bullJobId: String(job.id),
          trigger: 'CRON' as never,
          status: 'RUNNING' as never,
          scheduledAt: Number.isNaN(scheduledAt.getTime())
            ? new Date()
            : scheduledAt,
          startedAt: new Date(),
          attemptCount: 1,
        },
      });
      runId = legacyRun.id;
    }
    const syncLogId = await this.logs.startPipelineJob({
      apiName:
        context.source === 'SCIMAGO'
          ? 'SCImago Dataset'
          : context.source === 'SEMANTIC_SCHOLAR'
            ? 'Semantic Scholar'
            : 'OpenAlex',
      apiEndpoint:
        context.source === 'SCIMAGO'
          ? (process.env.SCIMAGO_DATASET_DIR ??
            '/app/docs/scimagojr/normalized')
          : context.source === 'SEMANTIC_SCHOLAR'
            ? this.semanticScholarConfig.getSemanticScholarSupplementConfig().baseUrl
            : config.baseUrl,
      source: context.source,
      jobType: context.type,
      startedAt: new Date(),
      jobRunId: runId,
    });
    const control: PipelineExecutionControl = {
      isCancellationRequested: async () => {
        if (!runId) {
          return false;
        }
        const run = await this.prisma.academicJobRun.findUnique({
          where: { id: runId },
          select: { cancellationRequestedAt: true },
        });
        return Boolean(run?.cancellationRequestedAt);
      },
      reportProgress: async ({ current, total }) => {
        const progress = {
          current: Math.max(0, current),
          total: total === undefined ? null : Math.max(0, total ?? 0),
        };
        await job.updateProgress(progress);
        if (runId) {
          await this.prisma.academicJobRun.update({
            where: { id: runId },
            data: {
              progressCurrent: progress.current,
              progressTotal: progress.total,
            },
          });
        }
      },
    };

    try {
      if (await control.isCancellationRequested()) {
        await this.logs.completePipelineJob(syncLogId, {
          finishedAt: new Date(),
          status: 'CANCELLED',
          totalFetched: 0,
          totalInserted: 0,
          totalUpdated: 0,
          totalErrors: 0,
          successCount: 0,
          failureCount: 0,
          metrics: { cancelledBeforeStart: true },
        });
        await this.prisma.academicJobRun.update({
          where: { id: runId },
          data: { status: 'CANCELLED' as never, finishedAt: new Date() },
        });
        await job.updateProgress({ current: 0, total: 0, status: 'cancelled' });
        return undefined as T;
      }
      const result = await task(control);
      const values = counters(result);
      const cancelled = await control.isCancellationRequested();
      await this.logs.completePipelineJob(syncLogId, {
        finishedAt: new Date(),
        status: cancelled ? 'CANCELLED' : 'SUCCESS',
        totalFetched: values.fetched,
        totalInserted: values.inserted,
        totalUpdated: values.updated,
        totalErrors: 0,
        successCount: values.inserted + values.updated || values.fetched,
        failureCount: 0,
        metrics: {
          fetched: values.fetched,
          inserted: values.inserted,
          updated: values.updated,
          cancelled,
        },
      });
      if (runId) {
        await this.prisma.academicJobRun.update({
          where: { id: runId },
          data: {
            status: cancelled ? ('CANCELLED' as never) : ('COMPLETED' as never),
            finishedAt: new Date(),
            progressCurrent: values.fetched,
            progressTotal: values.fetched,
          },
        });
      }
      await job.updateProgress({
        current: values.fetched,
        total: values.fetched,
        status: cancelled ? 'cancelled' : 'completed',
      });
      return result;
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : 'Unknown pipeline error';
      await this.logs.failPipelineJob(syncLogId, {
        finishedAt: new Date(),
        totalFetched: 0,
        totalInserted: 0,
        totalUpdated: 0,
        totalErrors: 1,
        errorDetail: detail,
        successCount: 0,
        failureCount: 1,
        metrics: { attemptsMade: job.attemptsMade + 1 },
      });
      if (runId) {
        const attempts = Number(job.opts.attempts ?? 1);
        const finalAttempt = job.attemptsMade + 1 >= attempts;
        await this.prisma.academicJobRun.update({
          where: { id: runId },
          data: {
            status: finalAttempt ? ('FAILED' as never) : ('WAITING' as never),
            ...(finalAttempt ? { finishedAt: new Date() } : {}),
            errorDetail: detail,
          },
        });
      }
      throw toQueueError(error);
    }
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.scimagoReload)
export class ScimagoReloadProcessor extends WorkerHost {
  private readonly logger = new Logger(ScimagoReloadProcessor.name);

  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly reload: ReloadScimagoDatasetUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    const result = await this.jobs.run(
      { source: 'SCIMAGO', type: 'SCIMAGO_RELOAD' },
      job,
      (control) => this.reload.execute(control),
      (output) => ({ fetched: output.records, inserted: 0, updated: 0 }),
    );
    if (result) {
      this.logger.log(`Reloaded ${result.records} SCImago records.`);
    }
    return result;
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.journalSourceSync)
export class JournalSourceSyncProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly resolve: ResolveScimagoJournalsUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    return this.jobs.run(
      { source: 'OPENALEX', type: 'JOURNAL_SOURCE_SYNC' },
      job,
      (control) => this.resolve.execute(control),
      (output) => ({
        fetched: output.journals,
        inserted: output.matched,
        updated: output.unmatched + output.conflicts,
      }),
    );
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.journalArticleSync)
export class JournalArticleSyncProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly sync: RunJournalArticleSyncPipelineUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    return this.jobs.run(
      { source: 'OPENALEX', type: 'JOURNAL_ARTICLE_SYNC' },
      job,
      (control) => this.sync.execute(control),
      (output) => ({
        fetched: output.pagesFetched,
        inserted: output.articlesInserted,
        updated: output.articlesUpdated,
      }),
    );
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.semanticScholarJournalSupplement)
export class SemanticScholarJournalSupplementProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly supplement: SupplementJournalsWithSemanticScholarUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    return this.jobs.run(
      {
        source: 'SEMANTIC_SCHOLAR',
        type: 'SEMANTIC_SCHOLAR_JOURNAL_SUPPLEMENT',
      },
      job,
      (control) => this.supplement.execute(control),
      (output) => ({
        fetched: output.newAccepted + output.relatedAccepted,
        inserted: output.articlesInserted,
        updated: output.articlesUpdated,
      }),
    );
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.relatedWorkSync)
export class RelatedWorkSyncProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly sync: SyncRelatedWorksUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    return this.jobs.run(
      { source: 'OPENALEX', type: 'RELATED_WORK_SYNC' },
      job,
      (control) => this.sync.execute(control),
      (output) => ({
        fetched: output.rootsSelected,
        inserted: output.rootsSynced,
        updated: output.batches,
      }),
    );
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.relatedWorkHydration)
export class RelatedWorkHydrationProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly hydrate: HydrateRelatedWorksUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    return this.jobs.run(
      { source: 'OPENALEX', type: 'RELATED_WORK_HYDRATION' },
      job,
      (control) => this.hydrate.execute(control),
      (output) => ({
        fetched: output.requested,
        inserted: output.hydrated,
        updated: output.discarded,
      }),
    );
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.outgoingReference)
export class OutgoingReferenceProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly crawl: CrawlOutgoingReferencesUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    return this.jobs.run(
      { source: 'OPENALEX', type: 'OUTGOING_REFERENCE_CRAWL' },
      job,
      (control) => this.crawl.execute(control),
      (output) => ({
        fetched: output.articlesSelected,
        inserted: output.edgesPrepared,
        updated: output.articlesHydrated,
      }),
    );
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.referenceHydration)
export class ReferenceHydrationProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly hydrate: HydrateReferencedWorksUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    return this.jobs.run(
      { source: 'OPENALEX', type: 'REFERENCE_HYDRATION' },
      job,
      (control) => this.hydrate.execute(control),
      (output) => ({
        fetched: output.requested,
        inserted: output.hydrated,
        updated: 0,
      }),
    );
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.incomingCitation)
export class IncomingCitationProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly crawl: CrawlIncomingCitationsUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    return this.jobs.run(
      { source: 'OPENALEX', type: 'INCOMING_CITATION_CRAWL' },
      job,
      (control) => this.crawl.execute(new Date(), control),
      (output) => ({
        fetched: output.citingWorks,
        inserted: output.citingWorks,
        updated: output.targets,
      }),
    );
  }
}

@Processor(ACADEMIC_PIPELINE_QUEUES.citationCountRefresh)
export class CitationCountRefreshProcessor extends WorkerHost {
  constructor(
    private readonly jobs: AcademicPipelineJobRunner,
    private readonly refresh: RefreshCitationCountsUseCase,
  ) {
    super();
  }

  async process(job: Job<PipelineJobData>): Promise<unknown> {
    void job;
    return this.jobs.run(
      { source: 'OPENALEX', type: 'CITATION_COUNT_REFRESH' },
      job,
      (control) => this.refresh.execute(new Date(), control),
      (output) => ({
        fetched: output.requested,
        inserted: 0,
        updated: output.updated,
      }),
    );
  }
}

export const ACADEMIC_PIPELINE_PROCESSORS = [
  AcademicPipelineJobRunner,
  ScimagoReloadProcessor,
  JournalSourceSyncProcessor,
  JournalArticleSyncProcessor,
  SemanticScholarJournalSupplementProcessor,
  RelatedWorkSyncProcessor,
  RelatedWorkHydrationProcessor,
  OutgoingReferenceProcessor,
  ReferenceHydrationProcessor,
  IncomingCitationProcessor,
  CitationCountRefreshProcessor,
] as const;

function toQueueError(error: unknown): Error {
  const message =
    error instanceof Error ? error.message : 'Unknown pipeline error';

  if (/HTTP (400|401|403)\b/u.test(message)) {
    return new UnrecoverableError(message);
  }

  return error instanceof Error ? error : new Error(message);
}

function isPipelineJobDataV2(
  value: PipelineJobData,
): value is Extract<PipelineJobData, { schemaVersion: 2 }> {
  return (
    'schemaVersion' in value && value.schemaVersion === 2 && 'runId' in value
  );
}

function queueNameFor(
  dataType:
    | 'SCIMAGO_RELOAD'
    | 'JOURNAL_SOURCE_SYNC'
    | 'JOURNAL_ARTICLE_SYNC'
    | 'SEMANTIC_SCHOLAR_JOURNAL_SUPPLEMENT'
    | 'RELATED_WORK_SYNC'
    | 'RELATED_WORK_HYDRATION'
    | 'OUTGOING_REFERENCE_CRAWL'
    | 'REFERENCE_HYDRATION'
    | 'INCOMING_CITATION_CRAWL'
    | 'CITATION_COUNT_REFRESH',
): AcademicPipelineQueueName {
  const definition = Object.values(ACADEMIC_PIPELINE_JOB_DEFINITIONS).find(
    (candidate) => candidate.dataType === dataType,
  );
  if (!definition) {
    throw new Error(`Unknown academic pipeline data type: ${dataType}`);
  }
  return definition.id;
}

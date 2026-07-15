import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { CrawlIncomingCitationsUseCase } from '@/academic/application/use-cases/crawl-incoming-citations/crawl-incoming-citations.use-case';
import { HydrateReferencedWorksUseCase } from '@/academic/application/use-cases/hydrate-referenced-works/hydrate-referenced-works.use-case';
import { RefreshCitationCountsUseCase } from '@/academic/application/use-cases/refresh-citation-counts/refresh-citation-counts.use-case';
import { ReloadScimagoDatasetUseCase } from '@/academic/application/use-cases/reload-scimago-dataset/reload-scimago-dataset.use-case';
import { ResolveScimagoJournalsUseCase } from '@/academic/application/use-cases/resolve-scimago-journals/resolve-scimago-journals.use-case';
import { RunJournalArticleSyncPipelineUseCase } from '@/academic/application/use-cases/run-journal-article-sync-pipeline/run-journal-article-sync-pipeline.use-case';
import { CrawlOutgoingReferencesUseCase } from '@/academic/application/use-cases/crawl-outgoing-references/crawl-outgoing-references.use-case';
import { HydrateRelatedWorksUseCase } from '@/academic/application/use-cases/hydrate-related-works/hydrate-related-works.use-case';
import { SyncRelatedWorksUseCase } from '@/academic/application/use-cases/sync-related-works/sync-related-works.use-case';
import { ACADEMIC_PIPELINE_QUEUES } from '@/academic/infrastructure/queue/academic-pipeline.queue';
import { OpenAlexEnvConfigReader } from '@/academic/infrastructure/config/openalex-env-config.reader';
import { PrismaAcademicSyncLogRepository } from '@/academic/infrastructure/persistence/prisma-academic-sync-log.repository';

type PipelineJobData = { scheduledAt: string };

@Injectable()
class AcademicPipelineJobRunner {
  constructor(
    private readonly logs: PrismaAcademicSyncLogRepository,
    private readonly openAlexConfig: OpenAlexEnvConfigReader,
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
        | 'CITATION_COUNT_REFRESH';
      source: 'OPENALEX' | 'SCIMAGO';
    },
    task: () => Promise<T>,
    counters: (result: T) => {
      fetched: number;
      inserted: number;
      updated: number;
    },
  ): Promise<T> {
    const config = this.openAlexConfig.getOpenAlexConfig();
    const syncLogId = await this.logs.startPipelineJob({
      apiName: context.source === 'SCIMAGO' ? 'SCImago Dataset' : 'OpenAlex',
      apiEndpoint:
        context.source === 'SCIMAGO'
          ? (process.env.SCIMAGO_DATASET_DIR ??
            '/app/docs/scimagojr/normalized')
          : config.baseUrl,
      source: context.source,
      jobType: context.type,
      startedAt: new Date(),
    });

    try {
      const result = await task();
      const values = counters(result);
      await this.logs.completePipelineJob(syncLogId, {
        finishedAt: new Date(),
        status: 'SUCCESS',
        totalFetched: values.fetched,
        totalInserted: values.inserted,
        totalUpdated: values.updated,
        totalErrors: 0,
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
      });
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
      () => this.reload.execute(),
      (output) => ({ fetched: output.records, inserted: 0, updated: 0 }),
    );
    this.logger.log(`Reloaded ${result.records} SCImago records.`);
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
      () => this.resolve.execute(),
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
      () => this.sync.execute(),
      (output) => ({
        fetched: output.pagesFetched,
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
      () => this.sync.execute(),
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
      () => this.hydrate.execute(),
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
      () => this.crawl.execute(),
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
      () => this.hydrate.execute(),
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
      () => this.crawl.execute(),
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
      () => this.refresh.execute(),
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

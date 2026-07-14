import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  AcademicGraphRepository,
} from '@/academic/application/ports/academic-graph.port';
import {
  ACADEMIC_SYNC_CHECKPOINT_REPOSITORY,
  AcademicSyncCheckpointRepository,
} from '@/academic/application/ports/academic-sync-checkpoint.port';
import {
  JOURNAL_RANKING_REPOSITORY,
  JournalRankingRepository,
} from '@/academic/application/ports/journal-ranking.port';
import {
  SCIMAGO_DATASET_DIRECTORY,
  SCIMAGO_DATASET_READER,
  ScimagoDatasetReader,
} from '@/academic/application/ports/scimago-dataset.port';
import { ExecuteOpenAlexSyncUseCase } from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.use-case';
import { CrawlIncomingCitationsUseCase } from '@/academic/application/use-cases/crawl-incoming-citations/crawl-incoming-citations.use-case';
import { HydrateReferencedWorksUseCase } from '@/academic/application/use-cases/hydrate-referenced-works/hydrate-referenced-works.use-case';
import { RefreshCitationCountsUseCase } from '@/academic/application/use-cases/refresh-citation-counts/refresh-citation-counts.use-case';
import { ReloadScimagoDatasetUseCase } from '@/academic/application/use-cases/reload-scimago-dataset/reload-scimago-dataset.use-case';
import { RunArticleSyncPipelineUseCase } from '@/academic/application/use-cases/run-article-sync-pipeline/run-article-sync-pipeline.use-case';
import { BackfillAcademicSearchDataUseCase } from '@/academic/application/use-cases/backfill-academic-search-data/backfill-academic-search-data.use-case';
import { GetArticleByIdUseCase } from '@/academic/application/use-cases/get-article-by-id/get-article-by-id.use-case';
import { GetAuthorByIdUseCase } from '@/academic/application/use-cases/get-author-by-id/get-author-by-id.use-case';
import { GetJournalByIdUseCase } from '@/academic/application/use-cases/get-journal-by-id/get-journal-by-id.use-case';
import { ListArticlesUseCase } from '@/academic/application/use-cases/list-articles/list-articles.use-case';
import { ListAuthorsUseCase } from '@/academic/application/use-cases/list-authors/list-authors.use-case';
import { ListJournalsUseCase } from '@/academic/application/use-cases/list-journals/list-journals.use-case';
import { ListJournalRankingsUseCase } from '@/academic/application/use-cases/list-journal-rankings/list-journal-rankings.use-case';
import { OpenAlexEnvConfigReader } from '@/academic/infrastructure/config/openalex-env-config.reader';
import { AcademicGraphSchemaInitializer } from '@/academic/infrastructure/neo4j/academic-graph-schema.initializer';
import { Neo4jAcademicGraphRepository } from '@/academic/infrastructure/neo4j/neo4j-academic-graph.repository';
import { AxiosOpenAlexWorksClient } from '@/academic/infrastructure/openalex/axios-openalex-works.client';
import { PrismaAcademicSyncLogRepository } from '@/academic/infrastructure/persistence/prisma-academic-sync-log.repository';
import { PrismaAcademicSyncCheckpointRepository } from '@/academic/infrastructure/persistence/prisma-academic-sync-checkpoint.repository';
import { PrismaJournalRankingRepository } from '@/academic/infrastructure/persistence/prisma-journal-ranking.repository';
import {
  defaultScimagoDatasetDirectory,
  FileSystemScimagoDatasetReader,
} from '@/academic/infrastructure/scimago/filesystem-scimago-dataset.reader';
import { CachedScimagoDatasetReader } from '@/academic/infrastructure/scimago/cached-scimago-dataset.reader';
import {
  ACADEMIC_PIPELINE_QUEUES,
  AcademicPipelineQueueProducer,
} from '@/academic/infrastructure/queue/academic-pipeline.queue';
import { ACADEMIC_PIPELINE_PROCESSORS } from '@/academic/infrastructure/queue/academic-pipeline.processor';
import { AcademicController } from '@/academic/interfaces/http/academic.controller';
import { AcademicPipelineScheduler } from '@/academic/interfaces/schedulers/academic-pipeline.scheduler';
import { Neo4jModule } from '@/neo4j/neo4j.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    Neo4jModule,
    PrismaModule,
    BullModule.registerQueue(
      ...Object.values(ACADEMIC_PIPELINE_QUEUES).map((name) => ({ name })),
    ),
  ],
  controllers: isAcademicWorker() ? [] : [AcademicController],
  providers: [
    AxiosOpenAlexWorksClient,
    OpenAlexEnvConfigReader,
    PrismaAcademicSyncLogRepository,
    PrismaAcademicSyncCheckpointRepository,
    PrismaJournalRankingRepository,
    FileSystemScimagoDatasetReader,
    CachedScimagoDatasetReader,
    AcademicPipelineQueueProducer,
    {
      provide: SCIMAGO_DATASET_DIRECTORY,
      useFactory: defaultScimagoDatasetDirectory,
    },
    Neo4jAcademicGraphRepository,
    AcademicGraphSchemaInitializer,
    {
      provide: BackfillAcademicSearchDataUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        worksClient: AxiosOpenAlexWorksClient,
        graphRepository: AcademicGraphRepository,
      ) =>
        new BackfillAcademicSearchDataUseCase(
          configReader,
          worksClient,
          graphRepository,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
      ],
    },
    {
      provide: ReloadScimagoDatasetUseCase,
      useFactory: (
        datasets: CachedScimagoDatasetReader,
        rankings: JournalRankingRepository,
      ) => new ReloadScimagoDatasetUseCase(datasets, rankings),
      inject: [CachedScimagoDatasetReader, JOURNAL_RANKING_REPOSITORY],
    },
    {
      provide: RunArticleSyncPipelineUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        checkpoints: AcademicSyncCheckpointRepository,
        sync: ExecuteOpenAlexSyncUseCase,
      ) => new RunArticleSyncPipelineUseCase(configReader, checkpoints, sync),
      inject: [
        OpenAlexEnvConfigReader,
        ACADEMIC_SYNC_CHECKPOINT_REPOSITORY,
        ExecuteOpenAlexSyncUseCase,
      ],
    },
    {
      provide: HydrateReferencedWorksUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        worksClient: AxiosOpenAlexWorksClient,
        graphRepository: AcademicGraphRepository,
      ) =>
        new HydrateReferencedWorksUseCase(
          configReader,
          worksClient,
          graphRepository,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
      ],
    },
    {
      provide: CrawlIncomingCitationsUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        worksClient: AxiosOpenAlexWorksClient,
        graphRepository: AcademicGraphRepository,
      ) =>
        new CrawlIncomingCitationsUseCase(
          configReader,
          worksClient,
          graphRepository,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
      ],
    },
    {
      provide: RefreshCitationCountsUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        worksClient: AxiosOpenAlexWorksClient,
        graphRepository: AcademicGraphRepository,
      ) =>
        new RefreshCitationCountsUseCase(
          configReader,
          worksClient,
          graphRepository,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
      ],
    },
    {
      provide: ExecuteOpenAlexSyncUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        worksClient: AxiosOpenAlexWorksClient,
        graphRepository: AcademicGraphRepository,
        syncLogs: PrismaAcademicSyncLogRepository,
        scimagoDatasets: ScimagoDatasetReader,
        rankings: JournalRankingRepository,
      ) =>
        new ExecuteOpenAlexSyncUseCase(
          configReader,
          worksClient,
          graphRepository,
          syncLogs,
          scimagoDatasets,
          rankings,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
        PrismaAcademicSyncLogRepository,
        SCIMAGO_DATASET_READER,
        JOURNAL_RANKING_REPOSITORY,
      ],
    },
    {
      provide: ListArticlesUseCase,
      useFactory: (graphRepository: AcademicGraphRepository) =>
        new ListArticlesUseCase(graphRepository),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ListAuthorsUseCase,
      useFactory: (graphRepository: AcademicGraphRepository) =>
        new ListAuthorsUseCase(graphRepository),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: GetArticleByIdUseCase,
      useFactory: (graphRepository: AcademicGraphRepository) =>
        new GetArticleByIdUseCase(graphRepository),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: GetAuthorByIdUseCase,
      useFactory: (graphRepository: AcademicGraphRepository) =>
        new GetAuthorByIdUseCase(graphRepository),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ListJournalsUseCase,
      useFactory: (graphRepository: AcademicGraphRepository) =>
        new ListJournalsUseCase(graphRepository),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ListJournalRankingsUseCase,
      useFactory: (datasets: ScimagoDatasetReader) =>
        new ListJournalRankingsUseCase(datasets),
      inject: [SCIMAGO_DATASET_READER],
    },
    {
      provide: GetJournalByIdUseCase,
      useFactory: (graphRepository: AcademicGraphRepository) =>
        new GetJournalByIdUseCase(graphRepository),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ACADEMIC_GRAPH_REPOSITORY,
      useExisting: Neo4jAcademicGraphRepository,
    },
    {
      provide: SCIMAGO_DATASET_READER,
      useExisting: CachedScimagoDatasetReader,
    },
    {
      provide: JOURNAL_RANKING_REPOSITORY,
      useExisting: PrismaJournalRankingRepository,
    },
    {
      provide: ACADEMIC_SYNC_CHECKPOINT_REPOSITORY,
      useExisting: PrismaAcademicSyncCheckpointRepository,
    },
    ...(isAcademicWorker()
      ? ACADEMIC_PIPELINE_PROCESSORS
      : [AcademicPipelineScheduler]),
  ],
  exports: [ExecuteOpenAlexSyncUseCase, ACADEMIC_GRAPH_REPOSITORY],
})
export class AcademicModule {}

function isAcademicWorker(): boolean {
  return process.env.ACADEMIC_WORKER_MODE === 'true';
}

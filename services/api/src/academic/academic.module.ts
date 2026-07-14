import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  AcademicGraphRepository,
} from '@/academic/application/ports/academic-graph.port';
import {
  ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
  AcademicJournalSyncStateRepository,
} from '@/academic/application/ports/academic-journal-sync-state.port';
import { OPENALEX_PAGE_BUDGET } from '@/academic/application/ports/openalex-page-budget.port';
import {
  OPENALEX_SOURCES_CATALOG,
  OpenAlexSourcesCatalog,
} from '@/academic/application/ports/openalex-source.port';
import {
  JOURNAL_RANKING_REPOSITORY,
  JournalRankingRepository,
} from '@/academic/application/ports/journal-ranking.port';
import {
  SCIMAGO_DATASET_DIRECTORY,
  SCIMAGO_DATASET_READER,
  ScimagoDatasetReader,
} from '@/academic/application/ports/scimago-dataset.port';
import { CrawlIncomingCitationsUseCase } from '@/academic/application/use-cases/crawl-incoming-citations/crawl-incoming-citations.use-case';
import { HydrateReferencedWorksUseCase } from '@/academic/application/use-cases/hydrate-referenced-works/hydrate-referenced-works.use-case';
import { RefreshCitationCountsUseCase } from '@/academic/application/use-cases/refresh-citation-counts/refresh-citation-counts.use-case';
import { ReloadScimagoDatasetUseCase } from '@/academic/application/use-cases/reload-scimago-dataset/reload-scimago-dataset.use-case';
import { ResolveScimagoJournalsUseCase } from '@/academic/application/use-cases/resolve-scimago-journals/resolve-scimago-journals.use-case';
import { RunJournalArticleSyncPipelineUseCase } from '@/academic/application/use-cases/run-journal-article-sync-pipeline/run-journal-article-sync-pipeline.use-case';
import { CrawlOutgoingReferencesUseCase } from '@/academic/application/use-cases/crawl-outgoing-references/crawl-outgoing-references.use-case';
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
import { AxiosOpenAlexSourcesClient } from '@/academic/infrastructure/openalex/axios-openalex-sources.client';
import { BullMqOpenAlexPageBudget } from '@/academic/infrastructure/queue/bullmq-openalex-page-budget';
import { PrismaAcademicSyncLogRepository } from '@/academic/infrastructure/persistence/prisma-academic-sync-log.repository';
import { PrismaAcademicJournalSyncStateRepository } from '@/academic/infrastructure/persistence/prisma-academic-journal-sync-state.repository';
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
    AxiosOpenAlexSourcesClient,
    OpenAlexEnvConfigReader,
    BullMqOpenAlexPageBudget,
    PrismaAcademicSyncLogRepository,
    PrismaAcademicJournalSyncStateRepository,
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
      provide: ResolveScimagoJournalsUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        datasets: ScimagoDatasetReader,
        sources: OpenAlexSourcesCatalog,
        states: AcademicJournalSyncStateRepository,
        graph: AcademicGraphRepository,
        rankings: JournalRankingRepository,
      ) =>
        new ResolveScimagoJournalsUseCase(
          configReader,
          datasets,
          sources,
          states,
          graph,
          rankings,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        SCIMAGO_DATASET_READER,
        OPENALEX_SOURCES_CATALOG,
        ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
        ACADEMIC_GRAPH_REPOSITORY,
        JOURNAL_RANKING_REPOSITORY,
      ],
    },
    {
      provide: RunJournalArticleSyncPipelineUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        states: AcademicJournalSyncStateRepository,
        works: AxiosOpenAlexWorksClient,
        graph: AcademicGraphRepository,
        budget: BullMqOpenAlexPageBudget,
      ) =>
        new RunJournalArticleSyncPipelineUseCase(
          configReader,
          states,
          works,
          graph,
          budget,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
        OPENALEX_PAGE_BUDGET,
      ],
    },
    {
      provide: CrawlOutgoingReferencesUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        works: AxiosOpenAlexWorksClient,
        graph: AcademicGraphRepository,
      ) => new CrawlOutgoingReferencesUseCase(configReader, works, graph),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
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
      useFactory: (
        datasets: ScimagoDatasetReader,
        states: AcademicJournalSyncStateRepository,
      ) => new ListJournalRankingsUseCase(datasets, states),
      inject: [SCIMAGO_DATASET_READER, ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY],
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
      provide: ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
      useExisting: PrismaAcademicJournalSyncStateRepository,
    },
    {
      provide: OPENALEX_SOURCES_CATALOG,
      useExisting: AxiosOpenAlexSourcesClient,
    },
    {
      provide: OPENALEX_PAGE_BUDGET,
      useExisting: BullMqOpenAlexPageBudget,
    },
    ...(isAcademicWorker()
      ? ACADEMIC_PIPELINE_PROCESSORS
      : [AcademicPipelineScheduler]),
  ],
  exports: [ACADEMIC_GRAPH_REPOSITORY],
})
export class AcademicModule {}

function isAcademicWorker(): boolean {
  return process.env.ACADEMIC_WORKER_MODE === 'true';
}

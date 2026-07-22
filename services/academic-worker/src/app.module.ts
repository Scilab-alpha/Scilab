import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
  AcademicGraphRepository,
  AcademicJournalSyncStateRepository,
  JOURNAL_RANKING_REPOSITORY,
  JournalRankingRepository,
  OPENALEX_PAGE_BUDGET,
  OPENALEX_SOURCES_CATALOG,
  OpenAlexSourcesCatalog,
  SCIMAGO_DATASET_DIRECTORY,
  SCIMAGO_DATASET_READER,
  ScimagoDatasetReader,
} from '@repo/academic/domain';
import {
  BackfillAcademicSearchDataUseCase,
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
import {
  AxiosOpenAlexSourcesClient,
  AxiosOpenAlexWorksClient,
  AxiosSemanticScholarPaperClient,
  BullMqOpenAlexPageBudget,
  CachedScimagoDatasetReader,
  defaultScimagoDatasetDirectory,
  FileSystemScimagoDatasetReader,
  Neo4jAcademicGraphRepository,
  OpenAlexEnvConfigReader,
  SemanticScholarEnvConfigReader,
  PrismaAcademicJournalSyncStateRepository,
  PrismaAcademicSyncLogRepository,
  PrismaJournalRankingRepository,
} from '@repo/academic/adapters';
import {
  ACADEMIC_PIPELINE_QUEUE_NAMES,
  createBullMqConnection,
} from '@repo/academic-queue';
import { PrismaModule } from '@repo/database';
import { Neo4jModule } from '@repo/neo4j';
import { ACADEMIC_PIPELINE_PROCESSORS } from './academic-pipeline.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    Neo4jModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: createBullMqConnection,
    }),
    BullModule.registerQueue(
      ...ACADEMIC_PIPELINE_QUEUE_NAMES.map((name) => ({ name })),
    ),
  ],
  providers: [
    AxiosOpenAlexWorksClient,
    AxiosSemanticScholarPaperClient,
    AxiosOpenAlexSourcesClient,
    OpenAlexEnvConfigReader,
    SemanticScholarEnvConfigReader,
    BullMqOpenAlexPageBudget,
    PrismaAcademicSyncLogRepository,
    PrismaAcademicJournalSyncStateRepository,
    PrismaJournalRankingRepository,
    FileSystemScimagoDatasetReader,
    CachedScimagoDatasetReader,
    Neo4jAcademicGraphRepository,
    {
      provide: SCIMAGO_DATASET_DIRECTORY,
      useFactory: defaultScimagoDatasetDirectory,
    },
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
        datasets: ScimagoDatasetReader,
        states: AcademicJournalSyncStateRepository,
        works: AxiosOpenAlexWorksClient,
        graph: AcademicGraphRepository,
        budget: BullMqOpenAlexPageBudget,
      ) =>
        new RunJournalArticleSyncPipelineUseCase(
          configReader,
          datasets,
          states,
          works,
          graph,
          budget,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        SCIMAGO_DATASET_READER,
        ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
        OPENALEX_PAGE_BUDGET,
      ],
    },
    {
      provide: SupplementJournalsWithSemanticScholarUseCase,
      useFactory: (
        configReader: SemanticScholarEnvConfigReader,
        datasets: ScimagoDatasetReader,
        states: AcademicJournalSyncStateRepository,
        papers: AxiosSemanticScholarPaperClient,
        graph: AcademicGraphRepository,
      ) =>
        new SupplementJournalsWithSemanticScholarUseCase(
          configReader,
          datasets,
          states,
          papers,
          graph,
        ),
      inject: [
        SemanticScholarEnvConfigReader,
        SCIMAGO_DATASET_READER,
        ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
        AxiosSemanticScholarPaperClient,
        ACADEMIC_GRAPH_REPOSITORY,
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
      provide: SyncRelatedWorksUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        works: AxiosOpenAlexWorksClient,
        graph: AcademicGraphRepository,
      ) => new SyncRelatedWorksUseCase(configReader, works, graph),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
      ],
    },
    {
      provide: HydrateRelatedWorksUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        works: AxiosOpenAlexWorksClient,
        graph: AcademicGraphRepository,
      ) => new HydrateRelatedWorksUseCase(configReader, works, graph),
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
        works: AxiosOpenAlexWorksClient,
        graph: AcademicGraphRepository,
      ) => new HydrateReferencedWorksUseCase(configReader, works, graph),
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
        works: AxiosOpenAlexWorksClient,
        graph: AcademicGraphRepository,
      ) => new CrawlIncomingCitationsUseCase(configReader, works, graph),
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
        works: AxiosOpenAlexWorksClient,
        graph: AcademicGraphRepository,
      ) => new RefreshCitationCountsUseCase(configReader, works, graph),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
      ],
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
    ...ACADEMIC_PIPELINE_PROCESSORS,
  ],
})
export class AppModule {}

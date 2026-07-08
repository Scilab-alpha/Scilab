import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  AcademicGraphRepository,
} from '@/academic/application/ports/academic-graph.port';
import { ExecuteOpenAlexSyncUseCase } from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.use-case';
import { GetArticleByIdUseCase } from '@/academic/application/use-cases/get-article-by-id/get-article-by-id.use-case';
import { GetAuthorByIdUseCase } from '@/academic/application/use-cases/get-author-by-id/get-author-by-id.use-case';
import { GetJournalByIdUseCase } from '@/academic/application/use-cases/get-journal-by-id/get-journal-by-id.use-case';
import { ListArticlesUseCase } from '@/academic/application/use-cases/list-articles/list-articles.use-case';
import { ListAuthorsUseCase } from '@/academic/application/use-cases/list-authors/list-authors.use-case';
import { ListJournalsUseCase } from '@/academic/application/use-cases/list-journals/list-journals.use-case';
import { OpenAlexEnvConfigReader } from '@/academic/infrastructure/config/openalex-env-config.reader';
import { AcademicGraphSchemaInitializer } from '@/academic/infrastructure/neo4j/academic-graph-schema.initializer';
import { Neo4jAcademicGraphRepository } from '@/academic/infrastructure/neo4j/neo4j-academic-graph.repository';
import { AxiosOpenAlexWorksClient } from '@/academic/infrastructure/openalex/axios-openalex-works.client';
import { PrismaAcademicSyncLogRepository } from '@/academic/infrastructure/persistence/prisma-academic-sync-log.repository';
import { AcademicController } from '@/academic/interfaces/http/academic.controller';
import { OpenAlexSyncScheduler } from '@/academic/interfaces/schedulers/openalex-sync.scheduler';
import { Neo4jModule } from '@/neo4j/neo4j.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [ConfigModule, Neo4jModule, PrismaModule],
  controllers: [AcademicController],
  providers: [
    AxiosOpenAlexWorksClient,
    OpenAlexEnvConfigReader,
    OpenAlexSyncScheduler,
    PrismaAcademicSyncLogRepository,
    Neo4jAcademicGraphRepository,
    AcademicGraphSchemaInitializer,
    {
      provide: ExecuteOpenAlexSyncUseCase,
      useFactory: (
        configReader: OpenAlexEnvConfigReader,
        worksClient: AxiosOpenAlexWorksClient,
        graphRepository: AcademicGraphRepository,
        syncLogs: PrismaAcademicSyncLogRepository,
      ) =>
        new ExecuteOpenAlexSyncUseCase(
          configReader,
          worksClient,
          graphRepository,
          syncLogs,
        ),
      inject: [
        OpenAlexEnvConfigReader,
        AxiosOpenAlexWorksClient,
        ACADEMIC_GRAPH_REPOSITORY,
        PrismaAcademicSyncLogRepository,
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
      provide: GetJournalByIdUseCase,
      useFactory: (graphRepository: AcademicGraphRepository) =>
        new GetJournalByIdUseCase(graphRepository),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ACADEMIC_GRAPH_REPOSITORY,
      useExisting: Neo4jAcademicGraphRepository,
    },
  ],
  exports: [ExecuteOpenAlexSyncUseCase, ACADEMIC_GRAPH_REPOSITORY],
})
export class AcademicModule {}

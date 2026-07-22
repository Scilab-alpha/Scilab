import { Module } from '@nestjs/common';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
  AcademicGraphRepository,
  AcademicJournalSyncStateRepository,
  SCIMAGO_DATASET_DIRECTORY,
  SCIMAGO_DATASET_READER,
  ScimagoDatasetReader,
} from '@repo/academic/domain';
import {
  GetArticleByIdUseCase,
  GetAuthorByIdUseCase,
  GetJournalByIdUseCase,
  ListArticlesUseCase,
  ListAuthorsUseCase,
  ListJournalRankingsUseCase,
  ListJournalsUseCase,
} from '@repo/academic/query';
import {
  CachedScimagoDatasetReader,
  defaultScimagoDatasetDirectory,
  FileSystemScimagoDatasetReader,
  Neo4jAcademicGraphRepository,
  PrismaAcademicJournalSyncStateRepository,
} from '@repo/academic/adapters';
import { PrismaModule } from '@repo/database';
import { Neo4jModule } from '@repo/neo4j';
import { AcademicController } from './http/academic.controller';

@Module({
  imports: [PrismaModule, Neo4jModule],
  controllers: [AcademicController],
  providers: [
    FileSystemScimagoDatasetReader,
    CachedScimagoDatasetReader,
    PrismaAcademicJournalSyncStateRepository,
    Neo4jAcademicGraphRepository,
    {
      provide: SCIMAGO_DATASET_DIRECTORY,
      useFactory: defaultScimagoDatasetDirectory,
    },
    {
      provide: ListArticlesUseCase,
      useFactory: (graph: AcademicGraphRepository) =>
        new ListArticlesUseCase(graph),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: GetArticleByIdUseCase,
      useFactory: (graph: AcademicGraphRepository) =>
        new GetArticleByIdUseCase(graph),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ListAuthorsUseCase,
      useFactory: (graph: AcademicGraphRepository) =>
        new ListAuthorsUseCase(graph),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: GetAuthorByIdUseCase,
      useFactory: (graph: AcademicGraphRepository) =>
        new GetAuthorByIdUseCase(graph),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ListJournalsUseCase,
      useFactory: (graph: AcademicGraphRepository) =>
        new ListJournalsUseCase(graph),
      inject: [ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: GetJournalByIdUseCase,
      useFactory: (graph: AcademicGraphRepository) =>
        new GetJournalByIdUseCase(graph),
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
      provide: ACADEMIC_GRAPH_REPOSITORY,
      useExisting: Neo4jAcademicGraphRepository,
    },
    {
      provide: SCIMAGO_DATASET_READER,
      useExisting: CachedScimagoDatasetReader,
    },
    {
      provide: ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
      useExisting: PrismaAcademicJournalSyncStateRepository,
    },
  ],
  exports: [
    ACADEMIC_GRAPH_REPOSITORY,
    SCIMAGO_DATASET_READER,
    ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
  ],
})
export class AcademicHttpModule {}

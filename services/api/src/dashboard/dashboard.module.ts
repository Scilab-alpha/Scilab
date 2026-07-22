import { Module } from '@nestjs/common';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
  AcademicGraphRepository,
  AcademicJournalSyncStateRepository,
  SCIMAGO_DATASET_READER,
  ScimagoDatasetReader,
} from '@repo/academic/domain';
import { AcademicHttpModule } from '@/academic/academic-http.module';
import { AuthModule } from '@/auth/auth.module';
import { BookmarkModule } from '@/bookmark/bookmark.module';
import { ListBookmarksUseCase } from '@/bookmark/application/use-cases/list-bookmarks/list-bookmarks.use-case';
import { PrismaBookmarkRepository } from '@/bookmark/infrastructure/persistence/prisma-bookmark.repository';
import { GetDashboardUseCase } from '@/dashboard/application/use-cases/get-dashboard/get-dashboard.use-case';
import { DashboardController } from '@/dashboard/interfaces/http/dashboard.controller';
import { FollowModule } from '@/follow/follow.module';
import { ListFollowsUseCase } from '@/follow/application/use-cases/list-follows/list-follows.use-case';
import { PrismaFollowRepository } from '@/follow/infrastructure/persistence/prisma-follow.repository';

@Module({
  imports: [AcademicHttpModule, AuthModule, BookmarkModule, FollowModule],
  controllers: [DashboardController],
  providers: [
    {
      provide: GetDashboardUseCase,
      useFactory: (
        bookmarks: PrismaBookmarkRepository,
        follows: PrismaFollowRepository,
        listBookmarks: ListBookmarksUseCase,
        listFollows: ListFollowsUseCase,
        graph: AcademicGraphRepository,
        datasets: ScimagoDatasetReader,
        journalStates: AcademicJournalSyncStateRepository,
      ) =>
        new GetDashboardUseCase(
          bookmarks,
          follows,
          listBookmarks,
          listFollows,
          graph,
          datasets,
          journalStates,
        ),
      inject: [
        PrismaBookmarkRepository,
        PrismaFollowRepository,
        ListBookmarksUseCase,
        ListFollowsUseCase,
        ACADEMIC_GRAPH_REPOSITORY,
        SCIMAGO_DATASET_READER,
        ACADEMIC_JOURNAL_SYNC_STATE_REPOSITORY,
      ],
    },
  ],
})
export class DashboardModule {}

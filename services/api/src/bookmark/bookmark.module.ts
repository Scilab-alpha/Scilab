import { Module } from '@nestjs/common';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  AcademicGraphRepository,
} from '@repo/academic/domain';
import { AcademicHttpModule } from '@/academic/academic-http.module';
import { AuthModule } from '@/auth/auth.module';
import { ListBookmarksUseCase } from '@/bookmark/application/use-cases/list-bookmarks/list-bookmarks.use-case';
import { ToggleBookmarkUseCase } from '@/bookmark/application/use-cases/toggle-bookmark/toggle-bookmark.use-case';
import { PrismaBookmarkRepository } from '@/bookmark/infrastructure/persistence/prisma-bookmark.repository';
import { BookmarkController } from '@/bookmark/interfaces/http/bookmark.controller';
import { EventsModule } from '@/events/events.module';
import { PrismaModule } from '@repo/database';

@Module({
  imports: [PrismaModule, AcademicHttpModule, AuthModule, EventsModule],
  controllers: [BookmarkController],
  providers: [
    PrismaBookmarkRepository,
    {
      provide: ListBookmarksUseCase,
      useFactory: (
        bookmarks: PrismaBookmarkRepository,
        graph: AcademicGraphRepository,
      ) => new ListBookmarksUseCase(bookmarks, graph),
      inject: [PrismaBookmarkRepository, ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ToggleBookmarkUseCase,
      useFactory: (
        bookmarks: PrismaBookmarkRepository,
        graph: AcademicGraphRepository,
      ) => new ToggleBookmarkUseCase(bookmarks, graph),
      inject: [PrismaBookmarkRepository, ACADEMIC_GRAPH_REPOSITORY],
    },
  ],
  exports: [PrismaBookmarkRepository, ListBookmarksUseCase],
})
export class BookmarkModule {}

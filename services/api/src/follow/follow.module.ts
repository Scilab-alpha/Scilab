import { Module } from '@nestjs/common';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  AcademicGraphRepository,
} from '@repo/academic/domain';
import { AcademicHttpModule } from '@/academic/academic-http.module';
import { AuthModule } from '@/auth/auth.module';
import { ListFollowsUseCase } from '@/follow/application/use-cases/list-follows/list-follows.use-case';
import { ToggleFollowUseCase } from '@/follow/application/use-cases/toggle-follow/toggle-follow.use-case';
import { UpdateFollowNotifyModeUseCase } from '@/follow/application/use-cases/update-follow-notify-mode/update-follow-notify-mode.use-case';
import { PrismaFollowRepository } from '@/follow/infrastructure/persistence/prisma-follow.repository';
import { FollowController } from '@/follow/interfaces/http/follow.controller';
import { EventsModule } from '@/events/events.module';
import { PrismaModule } from '@repo/database';

@Module({
  imports: [PrismaModule, AcademicHttpModule, AuthModule, EventsModule],
  controllers: [FollowController],
  providers: [
    PrismaFollowRepository,
    {
      provide: ListFollowsUseCase,
      useFactory: (
        follows: PrismaFollowRepository,
        graph: AcademicGraphRepository,
      ) => new ListFollowsUseCase(follows, graph),
      inject: [PrismaFollowRepository, ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: ToggleFollowUseCase,
      useFactory: (
        follows: PrismaFollowRepository,
        graph: AcademicGraphRepository,
      ) => new ToggleFollowUseCase(follows, graph),
      inject: [PrismaFollowRepository, ACADEMIC_GRAPH_REPOSITORY],
    },
    {
      provide: UpdateFollowNotifyModeUseCase,
      useFactory: (follows: PrismaFollowRepository) =>
        new UpdateFollowNotifyModeUseCase(follows),
      inject: [PrismaFollowRepository],
    },
  ],
  exports: [PrismaFollowRepository, ListFollowsUseCase],
})
export class FollowModule {}

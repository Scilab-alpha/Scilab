import { Module } from '@nestjs/common';
import {
  ACADEMIC_GRAPH_REPOSITORY,
  AcademicGraphRepository,
} from '@/academic/application/ports/academic-graph.port';
import { AcademicModule } from '@/academic/academic.module';
import { AuthModule } from '@/auth/auth.module';
import { ListFollowsUseCase } from '@/follow/application/use-cases/list-follows/list-follows.use-case';
import { ToggleFollowUseCase } from '@/follow/application/use-cases/toggle-follow/toggle-follow.use-case';
import { UpdateFollowNotifyModeUseCase } from '@/follow/application/use-cases/update-follow-notify-mode/update-follow-notify-mode.use-case';
import { PrismaFollowRepository } from '@/follow/infrastructure/persistence/prisma-follow.repository';
import { FollowController } from '@/follow/interfaces/http/follow.controller';
import { EventsModule } from '@/events/events.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AcademicModule, AuthModule, EventsModule],
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
  exports: [PrismaFollowRepository],
})
export class FollowModule {}

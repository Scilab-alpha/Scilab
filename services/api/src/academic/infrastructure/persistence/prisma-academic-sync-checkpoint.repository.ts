import { Injectable } from '@nestjs/common';
import {
  AcademicSyncCheckpoint,
  AcademicSyncCheckpointRepository,
} from '@/academic/application/ports/academic-sync-checkpoint.port';
import { PrismaService } from '@/prisma/prisma.service';

const ARTICLE_SYNC_CHECKPOINT_KEY = 'OPENALEX_ARTICLE_SYNC';

@Injectable()
export class PrismaAcademicSyncCheckpointRepository implements AcademicSyncCheckpointRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getArticleSyncCheckpoint(): Promise<AcademicSyncCheckpoint> {
    const checkpoint = await this.prisma.academicSyncCheckpoint.findUnique({
      where: { key: ARTICLE_SYNC_CHECKPOINT_KEY },
    });

    return {
      cursor: checkpoint?.cursor ?? null,
      initialBackfillComplete: checkpoint?.initialBackfillComplete ?? false,
      lastSuccessfulAt: checkpoint?.lastSuccessfulAt ?? null,
    };
  }

  async saveArticleSyncCheckpoint(
    checkpoint: AcademicSyncCheckpoint,
  ): Promise<void> {
    await this.prisma.academicSyncCheckpoint.upsert({
      where: { key: ARTICLE_SYNC_CHECKPOINT_KEY },
      update: checkpoint,
      create: {
        key: ARTICLE_SYNC_CHECKPOINT_KEY,
        ...checkpoint,
      },
    });
  }
}

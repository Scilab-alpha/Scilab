import { Injectable } from '@nestjs/common';
import {
  AcademicJournalSyncState,
  AcademicJournalSyncStateRepository,
} from '@repo/academic/application/ports/academic-journal-sync-state.port';
import {
  AcademicJournalMatchStatus,
  AcademicJournalSyncMode,
} from '@prisma/client';
import { PrismaService } from '@repo/database';

@Injectable()
export class PrismaAcademicJournalSyncStateRepository implements AcademicJournalSyncStateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByScimagoSourceIds(
    ids: string[],
  ): Promise<AcademicJournalSyncState[]> {
    if (ids.length === 0) {
      return [];
    }

    const states = await this.prisma.academicJournalSyncState.findMany({
      where: { scimagoSourceId: { in: ids } },
    });
    return states.map(toState);
  }

  async listMatchedBackfillContinuations(
    limit: number,
  ): Promise<AcademicJournalSyncState[]> {
    const states = await this.prisma.academicJournalSyncState.findMany({
      where: {
        matchStatus: AcademicJournalMatchStatus.MATCHED,
        initialBackfillComplete: false,
        cursor: { not: null },
        openAlexJournalId: { not: null },
      },
      orderBy: [{ updatedAt: 'asc' }, { scimagoSourceId: 'asc' }],
      take: limit,
    });
    return states.map(toState);
  }

  async upsert(state: AcademicJournalSyncState): Promise<void> {
    const data = {
      catalogYear: state.catalogYear,
      openAlexJournalId: state.openAlexJournalId,
      matchStatus: state.matchStatus,
      matchedIssn: state.matchedIssn,
      candidateJournalIds: state.candidateJournalIds,
      syncMode: state.syncMode,
      cursor: state.cursor,
      filterSignature: state.filterSignature,
      incrementalWindowFrom: state.incrementalWindowFrom,
      initialBackfillComplete: state.initialBackfillComplete,
      lastResolvedAt: state.lastResolvedAt,
      lastSuccessfulAt: state.lastSuccessfulAt,
      errorDetail: state.errorDetail,
    };
    await this.prisma.academicJournalSyncState.upsert({
      where: { scimagoSourceId: state.scimagoSourceId },
      update: data,
      create: { scimagoSourceId: state.scimagoSourceId, ...data },
    });
  }
}

function toState(state: {
  scimagoSourceId: string;
  catalogYear: number;
  openAlexJournalId: string | null;
  matchStatus: AcademicJournalMatchStatus;
  matchedIssn: string | null;
  candidateJournalIds: string[];
  syncMode: AcademicJournalSyncMode;
  cursor: string | null;
  filterSignature: string | null;
  incrementalWindowFrom: Date | null;
  initialBackfillComplete: boolean;
  lastResolvedAt: Date | null;
  lastSuccessfulAt: Date | null;
  errorDetail: string | null;
}): AcademicJournalSyncState {
  return { ...state };
}

import { Injectable } from '@nestjs/common';
import {
  AcademicJournalSyncState,
  AcademicJournalSyncStateRepository,
} from '@repo/academic/application/ports/academic-journal-sync-state.port';
import {
  AcademicJournalMatchStatus,
  AcademicJournalSyncMode,
  SemanticScholarSupplementStatus,
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
      semanticScholarStatus:
        (state.semanticScholarStatus as SemanticScholarSupplementStatus) ??
        SemanticScholarSupplementStatus.PENDING,
      semanticScholarNewToken: state.semanticScholarNewToken ?? null,
      semanticScholarNewAccepted: state.semanticScholarNewAccepted ?? 0,
      semanticScholarRelatedAccepted: state.semanticScholarRelatedAccepted ?? 0,
      semanticScholarProcessedSeedIds:
        state.semanticScholarProcessedSeedIds ?? [],
      semanticScholarStartedAt: state.semanticScholarStartedAt ?? null,
      semanticScholarCompletedAt: state.semanticScholarCompletedAt ?? null,
      semanticScholarErrorDetail: state.semanticScholarErrorDetail ?? null,
    };
    await this.prisma.academicJournalSyncState.upsert({
      where: { scimagoSourceId: state.scimagoSourceId },
      update: data,
      create: { scimagoSourceId: state.scimagoSourceId, ...data },
    });
  }

  async claimSemanticScholarStates(
    scimagoSourceIds: string[],
  ): Promise<AcademicJournalSyncState[]> {
    if (scimagoSourceIds.length === 0) {
      return [];
    }

    return this.prisma.$transaction(async (transaction) => {
      const claimedAt = new Date();
      const staleBefore = new Date(claimedAt.getTime() - 24 * 60 * 60 * 1000);
      await transaction.academicJournalSyncState.updateMany({
        where: {
          scimagoSourceId: { in: scimagoSourceIds },
          semanticScholarStatus: SemanticScholarSupplementStatus.RUNNING,
          semanticScholarStartedAt: { lt: staleBefore },
        },
        data: {
          semanticScholarStatus: SemanticScholarSupplementStatus.PENDING,
          semanticScholarErrorDetail: 'Recovered stale Semantic Scholar claim',
        },
      });
      await transaction.academicJournalSyncState.updateMany({
        where: {
          scimagoSourceId: { in: scimagoSourceIds },
          matchStatus: AcademicJournalMatchStatus.MATCHED,
          initialBackfillComplete: true,
          openAlexJournalId: { not: null },
          semanticScholarStatus: SemanticScholarSupplementStatus.PENDING,
        },
        data: {
          semanticScholarStatus: SemanticScholarSupplementStatus.RUNNING,
          semanticScholarStartedAt: claimedAt,
          semanticScholarErrorDetail: null,
        },
      });
      const claimed = await transaction.academicJournalSyncState.findMany({
        where: {
          scimagoSourceId: { in: scimagoSourceIds },
          semanticScholarStatus: SemanticScholarSupplementStatus.RUNNING,
          semanticScholarStartedAt: claimedAt,
        },
      });
      const positions = new Map(
        scimagoSourceIds.map((sourceId, index) => [sourceId, index]),
      );
      return claimed
        .sort(
          (left, right) =>
            (positions.get(left.scimagoSourceId) ?? Number.MAX_SAFE_INTEGER) -
            (positions.get(right.scimagoSourceId) ?? Number.MAX_SAFE_INTEGER),
        )
        .map(toState);
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
  semanticScholarStatus: SemanticScholarSupplementStatus;
  semanticScholarNewToken: string | null;
  semanticScholarNewAccepted: number;
  semanticScholarRelatedAccepted: number;
  semanticScholarProcessedSeedIds: string[];
  semanticScholarStartedAt: Date | null;
  semanticScholarCompletedAt: Date | null;
  semanticScholarErrorDetail: string | null;
}): AcademicJournalSyncState {
  return { ...state };
}

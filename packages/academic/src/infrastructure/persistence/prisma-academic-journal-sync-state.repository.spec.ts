import { PrismaAcademicJournalSyncStateRepository } from './prisma-academic-journal-sync-state.repository';

describe('PrismaAcademicJournalSyncStateRepository', () => {
  it('rotates incomplete matched journals with a saved cursor and upserts per-journal state', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const upsert = jest.fn().mockResolvedValue({});
    const repository = new PrismaAcademicJournalSyncStateRepository({
      academicJournalSyncState: { findMany, upsert },
    } as never);

    await repository.listMatchedBackfillContinuations(25);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
        where: {
          matchStatus: 'MATCHED',
          initialBackfillComplete: false,
          cursor: { not: null },
          openAlexJournalId: { not: null },
        },
        orderBy: [{ updatedAt: 'asc' }, { scimagoSourceId: 'asc' }],
      }),
    );

    await repository.upsert({
      scimagoSourceId: '28773',
      catalogYear: 2025,
      openAlexJournalId: 'S1',
      matchStatus: 'MATCHED',
      matchedIssn: '1542-4863',
      candidateJournalIds: ['S1'],
      syncMode: 'BACKFILL',
      cursor: '*',
      filterSignature: 'signature',
      incrementalWindowFrom: null,
      initialBackfillComplete: false,
      lastResolvedAt: null,
      lastSuccessfulAt: null,
      errorDetail: null,
    });
    const [input] = upsert.mock.calls[0] as unknown as [
      {
        where: { scimagoSourceId: string };
        create: { openAlexJournalId: string };
      },
    ];
    expect(input.where.scimagoSourceId).toBe('28773');
    expect(input.create.openAlexJournalId).toBe('S1');
  });

  it('recovers only claims that have been running for more than 24 hours before re-claiming them', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findMany = jest.fn().mockResolvedValue([
      {
        scimagoSourceId: '28773',
        catalogYear: 2025,
        openAlexJournalId: 'S1',
        matchStatus: 'MATCHED',
        matchedIssn: null,
        candidateJournalIds: [],
        syncMode: 'INCREMENTAL',
        cursor: null,
        filterSignature: null,
        incrementalWindowFrom: null,
        initialBackfillComplete: true,
        lastResolvedAt: null,
        lastSuccessfulAt: null,
        errorDetail: null,
        semanticScholarStatus: 'RUNNING',
        semanticScholarNewToken: null,
        semanticScholarNewAccepted: 0,
        semanticScholarRelatedAccepted: 0,
        semanticScholarProcessedSeedIds: [],
        semanticScholarStartedAt: new Date(),
        semanticScholarCompletedAt: null,
        semanticScholarErrorDetail: null,
      },
    ]);
    const repository = new PrismaAcademicJournalSyncStateRepository({
      $transaction: async (work: (transaction: unknown) => unknown) =>
        work({ academicJournalSyncState: { updateMany, findMany } }),
    } as never);

    await repository.claimSemanticScholarStates(['28773']);

    expect(updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          semanticScholarStatus: 'RUNNING',
          semanticScholarStartedAt: { lt: expect.any(Date) },
        }),
        data: expect.objectContaining({ semanticScholarStatus: 'PENDING' }),
      }),
    );
    expect(updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ semanticScholarStatus: 'PENDING' }),
        data: expect.objectContaining({
          semanticScholarStatus: 'RUNNING',
          semanticScholarStartedAt: expect.any(Date),
        }),
      }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          semanticScholarStatus: 'RUNNING',
          semanticScholarStartedAt: expect.any(Date),
        }),
      }),
    );
  });
});

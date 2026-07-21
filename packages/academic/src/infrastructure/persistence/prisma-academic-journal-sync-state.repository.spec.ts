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
});

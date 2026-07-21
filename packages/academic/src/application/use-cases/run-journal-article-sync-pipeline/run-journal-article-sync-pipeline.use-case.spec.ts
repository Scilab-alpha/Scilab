import { AcademicJournalSyncState } from '@repo/academic/application/ports/academic-journal-sync-state.port';
import { OpenAlexJournalSyncConfig } from '@repo/academic/application/ports/openalex-config.port';
import {
  buildScimagoDataset,
  ScimagoRecord,
} from '@repo/academic/domain/scimago.model';
import { RunJournalArticleSyncPipelineUseCase } from './run-journal-article-sync-pipeline.use-case';

const defaultConfig: OpenAlexJournalSyncConfig = {
  apiKey: 'key',
  baseUrl: 'url',
  journalBackfillFromYear: 2020,
  dailyPageBudget: 10,
  priorityPercent: 80,
  maxPagesPerPass: 10,
  sourceBatchSize: 100,
  journalBatchSize: 100,
  outgoingReferenceBatchSize: 100,
};

describe('RunJournalArticleSyncPipelineUseCase', () => {
  it('starts an unstarted ranked journal at cursor star, persists only after the page succeeds, and omits references', async () => {
    const { execute, fetchWorks, upsert } = createUseCase({
      records: [record('source', 1)],
      priorityStates: [state('source', 'S1')],
      fetchWorks: jest.fn().mockResolvedValue({
        meta: { next_cursor: null },
        results: [
          {
            id: 'https://openalex.org/W1',
            title: 'Article',
            referenced_works: ['https://openalex.org/W2'],
          },
        ],
      }),
    });

    await expect(execute()).resolves.toMatchObject({
      pagesFetched: 1,
      pagesAttempted: 1,
      articlesInserted: 1,
      priorityPagesAttempted: 1,
      continuationPagesAttempted: 0,
    });
    const [calledInput] = fetchWorks.mock.calls[0] as unknown as [
      { cursor: string; config: { filter: string } },
    ];
    expect(calledInput.cursor).toBe('*');
    expect(calledInput.config.filter).toBe(
      'primary_location.source.id:S1,type:article,from_publication_date:2020-01-01',
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ initialBackfillComplete: true, cursor: null }),
    );
  });

  it('selects the newest catalog in SCImago rank order, with null ranks last', async () => {
    const { execute, fetchWorks } = createUseCase({
      config: { ...defaultConfig, dailyPageBudget: 3 },
      records: [
        record('old', 0, 2024),
        record('second', 2),
        record('null-rank', null),
        record('first', 1),
        record('not-a-journal', 0, 2025, 'book'),
      ],
      priorityStates: [
        state('first', 'S1'),
        state('second', 'S2'),
        state('null-rank', 'S3'),
        state('not-a-journal', 'S4'),
      ],
    });

    await execute();

    expect(fetchWorks.mock.calls.map((call) => call[0].config.filter)).toEqual([
      expect.stringContaining('primary_location.source.id:S1'),
      expect.stringContaining('primary_location.source.id:S2'),
      expect.stringContaining('primary_location.source.id:S3'),
    ]);
  });

  it('uses an 80/20 page-attempt split and gives each priority journal one page', async () => {
    const { execute, fetchWorks } = createUseCase({
      records: Array.from({ length: 10 }, (_, index) =>
        record(`priority-${index + 1}`, index + 1),
      ),
      priorityStates: Array.from({ length: 10 }, (_, index) =>
        state(`priority-${index + 1}`, `SP${index + 1}`),
      ),
      continuationStates: [
        state('continuation', 'SC', { cursor: 'resume-cursor' }),
      ],
    });

    await expect(execute()).resolves.toMatchObject({
      pagesAttempted: 10,
      priorityPagesAttempted: 8,
      continuationPagesAttempted: 2,
      priorityJournalsVisited: 8,
      continuationJournalsVisited: 1,
    });

    const filters = fetchWorks.mock.calls.map((call) => call[0].config.filter);
    expect(
      filters.filter((filter) => filter.includes('source.id:SC')),
    ).toHaveLength(2);
    for (let index = 1; index <= 8; index += 1) {
      expect(
        filters.filter((filter) => filter.includes(`source.id:SP${index}`)),
      ).toHaveLength(1);
    }
  });

  it('lets continuation borrow unused priority quota', async () => {
    const { execute, fetchWorks } = createUseCase({
      records: [
        record('priority-1', 1),
        record('priority-2', 2),
        record('priority-3', 3),
      ],
      priorityStates: [
        state('priority-1', 'SP1'),
        state('priority-2', 'SP2'),
        state('priority-3', 'SP3'),
      ],
      continuationStates: [
        state('continuation', 'SC', { cursor: 'resume-cursor' }),
      ],
    });

    await expect(execute()).resolves.toMatchObject({
      pagesAttempted: 10,
      priorityPagesAttempted: 3,
      continuationPagesAttempted: 7,
    });
    expect(
      fetchWorks.mock.calls.filter((call) =>
        call[0].config.filter.includes('source.id:SC'),
      ),
    ).toHaveLength(7);
  });

  it('lets ranked journals borrow unused continuation quota without revisiting a priority journal', async () => {
    const fetchWorks = jest.fn().mockImplementation(({ config }) =>
      Promise.resolve({
        meta: {
          next_cursor: config.filter.includes('source.id:SC') ? null : 'next',
        },
        results: [],
      }),
    );
    const { execute } = createUseCase({
      records: Array.from({ length: 10 }, (_, index) =>
        record(`priority-${index + 1}`, index + 1),
      ),
      priorityStates: Array.from({ length: 10 }, (_, index) =>
        state(`priority-${index + 1}`, `SP${index + 1}`),
      ),
      continuationStates: [
        state('continuation', 'SC', { cursor: 'resume-cursor' }),
      ],
      fetchWorks,
    });

    await expect(execute()).resolves.toMatchObject({
      pagesAttempted: 10,
      priorityPagesAttempted: 9,
      continuationPagesAttempted: 1,
    });
    expect(
      fetchWorks.mock.calls.filter((call) =>
        call[0].config.filter.includes('source.id:SP1'),
      ),
    ).toHaveLength(1);
    expect(
      fetchWorks.mock.calls.filter((call) =>
        call[0].config.filter.includes('source.id:SP9'),
      ),
    ).toHaveLength(1);
  });

  it('caps continuation at the configured pages per journal', async () => {
    const { execute, fetchWorks } = createUseCase({
      config: {
        ...defaultConfig,
        dailyPageBudget: 12,
        priorityPercent: 10,
      },
      records: [record('priority-1', 1), record('priority-2', 2)],
      priorityStates: [state('priority-1', 'SP1'), state('priority-2', 'SP2')],
      continuationStates: [
        state('continuation', 'SC', { cursor: 'resume-cursor' }),
      ],
    });

    await execute();

    expect(
      fetchWorks.mock.calls.filter((call) =>
        call[0].config.filter.includes('source.id:SC'),
      ),
    ).toHaveLength(10);
  });

  it('counts a failed request as an attempt, preserves its cursor, and continues to the next journal', async () => {
    const fetchWorks = jest
      .fn()
      .mockRejectedValueOnce(new Error('OpenAlex unavailable'))
      .mockResolvedValue({ meta: { next_cursor: null }, results: [] });
    const { execute, upsert } = createUseCase({
      config: { ...defaultConfig, dailyPageBudget: 2 },
      records: [record('first', 1), record('second', 2)],
      priorityStates: [state('first', 'S1'), state('second', 'S2')],
      fetchWorks,
    });

    await expect(execute()).resolves.toMatchObject({
      errors: 1,
      pagesAttempted: 2,
      priorityPagesAttempted: 2,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        scimagoSourceId: 'first',
        cursor: null,
        errorDetail: 'OpenAlex unavailable',
      }),
    );
    expect(fetchWorks).toHaveBeenCalledTimes(2);
  });
});

function createUseCase(input: {
  config?: OpenAlexJournalSyncConfig;
  records?: ScimagoRecord[];
  priorityStates?: AcademicJournalSyncState[];
  continuationStates?: AcademicJournalSyncState[];
  fetchWorks?: jest.Mock;
}) {
  const config = input.config ?? defaultConfig;
  const upsert = jest.fn().mockResolvedValue(undefined);
  const fetchWorks =
    input.fetchWorks ??
    jest.fn().mockResolvedValue({ meta: { next_cursor: 'next' }, results: [] });
  const findByScimagoSourceIds = jest
    .fn()
    .mockImplementation(async (ids: string[]) =>
      (input.priorityStates ?? []).filter((item) =>
        ids.includes(item.scimagoSourceId),
      ),
    );
  const listMatchedBackfillContinuations = jest
    .fn()
    .mockResolvedValue(input.continuationStates ?? []);

  return {
    execute: () =>
      new RunJournalArticleSyncPipelineUseCase(
        {
          getJournalSyncConfig: () => config,
          getOpenAlexConfig: jest.fn(),
        },
        {
          load: jest
            .fn()
            .mockResolvedValue(buildScimagoDataset(input.records ?? [])),
        },
        {
          findByScimagoSourceIds,
          listMatchedBackfillContinuations,
          upsert,
        },
        { fetchWorks, fetchWorksByIds: jest.fn() },
        {
          upsertArticleGraphs: jest
            .fn()
            .mockResolvedValue({ inserted: 1, updated: 0 }),
        } as never,
        { tryConsume: jest.fn().mockResolvedValue(true) },
      ).execute(),
    fetchWorks,
    findByScimagoSourceIds,
    listMatchedBackfillContinuations,
    upsert,
  };
}

function record(
  sourceId: string,
  rank: number | null,
  year = 2025,
  type = 'journal',
): ScimagoRecord {
  return {
    year,
    sourceId,
    title: sourceId,
    type,
    issns: [],
    sjr: null,
    hIndex: null,
    rank,
    bestQuartile: null,
    categories: [],
    areas: [],
  };
}

function state(
  scimagoSourceId: string,
  openAlexJournalId: string,
  overrides: Partial<AcademicJournalSyncState> = {},
): AcademicJournalSyncState {
  return {
    scimagoSourceId,
    catalogYear: 2025,
    openAlexJournalId,
    matchStatus: 'MATCHED',
    matchedIssn: '1542-4863',
    candidateJournalIds: [openAlexJournalId],
    syncMode: 'BACKFILL',
    cursor: null,
    filterSignature: null,
    incrementalWindowFrom: null,
    initialBackfillComplete: false,
    lastResolvedAt: null,
    lastSuccessfulAt: null,
    errorDetail: null,
    ...overrides,
  };
}

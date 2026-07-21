import { AcademicJournalSyncState } from '@repo/academic/application/ports/academic-journal-sync-state.port';
import { SemanticScholarSupplementConfig } from '@repo/academic/application/ports/semantic-scholar.port';
import {
  buildScimagoDataset,
  ScimagoRecord,
} from '@repo/academic/domain/scimago.model';
import { SupplementJournalsWithSemanticScholarUseCase } from './supplement-journals-with-semantic-scholar.use-case';

const config: SemanticScholarSupplementConfig = {
  apiKey: 'key',
  baseUrl: 'https://api.semanticscholar.org',
  journalBackfillFromYear: 2020,
  newTarget: 1,
  relatedTarget: 2,
  maxJournalsPerRun: 10,
  maxBulkPagesPerJournal: 10,
  maxRecommendationSeeds: 20,
  requestsPerSecond: 10_000,
};

describe('SupplementJournalsWithSemanticScholarUseCase', () => {
  it('supplements only completed OpenAlex journals with newest papers and quality-seeded recommendations', async () => {
    const state = journalState();
    const searchBulk = jest
      .fn()
      .mockResolvedValueOnce({
        data: [paper('new-1', '10.1/new')],
        token: null,
      })
      .mockResolvedValueOnce({
        data: [paper('seed-1', '10.1/seed')],
        token: null,
      });
    const getRecommendations = jest.fn().mockResolvedValue({
      recommendedPapers: [paper('related-1', '10.1/related', 'Other Journal')],
    });
    const upsertSemanticScholarArticleGraphs = jest
      .fn()
      .mockResolvedValue({ inserted: 1, updated: 0 });
    const upsert = jest.fn().mockResolvedValue(undefined);

    const result = await new SupplementJournalsWithSemanticScholarUseCase(
      { getSemanticScholarSupplementConfig: () => config },
      { load: jest.fn().mockResolvedValue(buildScimagoDataset([record()])) },
      {
        findByScimagoSourceIds: jest.fn().mockResolvedValue([state]),
        claimSemanticScholarStates: jest.fn().mockResolvedValue([state]),
        listMatchedBackfillContinuations: jest.fn(),
        upsert,
      },
      { searchBulk, getRecommendations },
      {
        findSemanticScholarDiscoveredPaperIds: jest
          .fn()
          .mockResolvedValue(new Set()),
        upsertSemanticScholarArticleGraphs,
      } as never,
    ).execute();

    expect(searchBulk).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sort: 'publicationDate:desc',
        venue: 'Journal One',
      }),
    );
    expect(searchBulk).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ sort: 'citationCount:desc' }),
    );
    expect(getRecommendations).toHaveBeenCalledWith(
      expect.objectContaining({ positivePaperId: 'seed-1', limit: 500 }),
    );
    expect(result).toMatchObject({
      journalsClaimed: 1,
      journalsCompleted: 1,
      newAccepted: 1,
      relatedAccepted: 2,
      recommendationCalls: 1,
    });
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        semanticScholarStatus: 'COMPLETED',
        semanticScholarNewAccepted: 1,
        semanticScholarRelatedAccepted: 2,
      }),
    );
    const recommendationGraphs =
      upsertSemanticScholarArticleGraphs.mock.calls[2][0];
    expect(recommendationGraphs[0]).toMatchObject({
      attachOriginJournal: false,
      relatedFromSemanticScholarId: 'seed-1',
    });
  });

  it('marks a one-time pass as a shortfall when DOI/type filters leave its quota incomplete', async () => {
    const state = journalState();
    const upsert = jest.fn().mockResolvedValue(undefined);
    const result = await new SupplementJournalsWithSemanticScholarUseCase(
      { getSemanticScholarSupplementConfig: () => config },
      { load: jest.fn().mockResolvedValue(buildScimagoDataset([record()])) },
      {
        findByScimagoSourceIds: jest.fn().mockResolvedValue([state]),
        claimSemanticScholarStates: jest.fn().mockResolvedValue([state]),
        listMatchedBackfillContinuations: jest.fn(),
        upsert,
      },
      {
        searchBulk: jest.fn().mockResolvedValue({
          data: [{ paperId: 'missing-doi', title: 'Discarded', year: 2024 }],
          token: null,
        }),
        getRecommendations: jest.fn(),
      },
      {
        findSemanticScholarDiscoveredPaperIds: jest
          .fn()
          .mockResolvedValue(new Set()),
        upsertSemanticScholarArticleGraphs: jest.fn(),
      } as never,
    ).execute();

    expect(result).toMatchObject({
      journalsShortfall: 1,
      newAccepted: 0,
      relatedAccepted: 0,
    });
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        semanticScholarStatus: 'COMPLETED_WITH_SHORTFALL',
      }),
    );
  });

  it('releases its claim when cancellation is requested between durable lanes', async () => {
    const state = journalState();
    const upsert = jest.fn().mockResolvedValue(undefined);
    const result = await new SupplementJournalsWithSemanticScholarUseCase(
      { getSemanticScholarSupplementConfig: () => config },
      { load: jest.fn().mockResolvedValue(buildScimagoDataset([record()])) },
      {
        findByScimagoSourceIds: jest.fn().mockResolvedValue([state]),
        claimSemanticScholarStates: jest.fn().mockResolvedValue([state]),
        listMatchedBackfillContinuations: jest.fn(),
        upsert,
      },
      {
        searchBulk: jest.fn().mockResolvedValue({
          data: [paper('new-1', '10.1/new')],
          token: null,
        }),
        getRecommendations: jest.fn(),
      },
      {
        findSemanticScholarDiscoveredPaperIds: jest
          .fn()
          .mockResolvedValue(new Set()),
        upsertSemanticScholarArticleGraphs: jest
          .fn()
          .mockResolvedValue({ inserted: 1, updated: 0 }),
      } as never,
    ).execute({
      isCancellationRequested: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true),
    });

    expect(result).toMatchObject({
      journalsClaimed: 1,
      journalsCompleted: 0,
      journalsShortfall: 1,
    });
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        semanticScholarStatus: 'PENDING',
        semanticScholarNewAccepted: 1,
        semanticScholarErrorDetail: 'Supplementation was cancelled',
      }),
    );
  });
});

function paper(paperId: string, doi: string, venue = 'Journal One') {
  return {
    paperId,
    externalIds: { DOI: doi },
    title: paperId,
    year: 2024,
    citationCount: 10,
    publicationTypes: ['JournalArticle'],
    publicationVenue: { name: venue },
  };
}

function record(): ScimagoRecord {
  return {
    year: 2025,
    sourceId: 'source-1',
    title: 'Journal One',
    type: 'journal',
    issns: ['1234-5678'],
    sjr: 1,
    hIndex: 1,
    rank: 1,
    bestQuartile: 'Q1',
    categories: [],
    areas: [],
  };
}

function journalState(): AcademicJournalSyncState {
  return {
    scimagoSourceId: 'source-1',
    catalogYear: 2025,
    openAlexJournalId: 'S1',
    matchStatus: 'MATCHED',
    matchedIssn: '1234-5678',
    candidateJournalIds: ['S1'],
    syncMode: 'INCREMENTAL',
    cursor: null,
    filterSignature: null,
    incrementalWindowFrom: null,
    initialBackfillComplete: true,
    lastResolvedAt: null,
    lastSuccessfulAt: new Date(),
    errorDetail: null,
    semanticScholarStatus: 'PENDING',
    semanticScholarNewToken: null,
    semanticScholarNewAccepted: 0,
    semanticScholarRelatedAccepted: 0,
    semanticScholarProcessedSeedIds: [],
    semanticScholarStartedAt: null,
    semanticScholarCompletedAt: null,
    semanticScholarErrorDetail: null,
  };
}

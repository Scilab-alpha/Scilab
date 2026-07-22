import { GetDashboardUseCase } from '@/dashboard/application/use-cases/get-dashboard/get-dashboard.use-case';

describe('GetDashboardUseCase', () => {
  it('returns user-scoped counts and five-item previews in parallel', async () => {
    const bookmarks = { countByUser: jest.fn().mockResolvedValue(7) };
    const follows = { countByUser: jest.fn().mockResolvedValue(3) };
    const listBookmarks = {
      execute: jest.fn().mockResolvedValue({
        items: [
          {
            articleId: 'article-1',
            bookmarkedAt: new Date('2026-07-23T00:00:00.000Z'),
            article: { id: 'article-1', title: 'Saved article' },
          },
        ],
        page: 1,
        limit: 5,
        hasMore: true,
      }),
    };
    const listFollows = {
      execute: jest.fn().mockResolvedValue({
        items: [
          {
            followId: 'follow-1',
            objectType: 'JOURNAL',
            objectId: 'journal-1',
            notifyMode: 'IN_APP',
            followedAt: new Date('2026-07-22T00:00:00.000Z'),
            target: { type: 'JOURNAL', id: 'journal-1', displayName: 'Nature' },
          },
        ],
        page: 1,
        limit: 5,
        hasMore: false,
      }),
    };
    const graph = {
      getCatalogDashboardInsights: jest
        .fn()
        .mockResolvedValue(catalogInsights()),
    };
    const datasets = {
      load: jest.fn().mockResolvedValue(scimagoDataset()),
    };
    const journalStates = {
      findByScimagoSourceIds: jest.fn().mockResolvedValue([
        {
          scimagoSourceId: 'journal-1',
          matchStatus: 'MATCHED',
          openAlexJournalId: 'S1',
        },
      ]),
    };
    const useCase = new GetDashboardUseCase(
      bookmarks,
      follows,
      listBookmarks as never,
      listFollows as never,
      graph,
      datasets,
      journalStates,
    );

    await expect(useCase.execute({ userId: 'user-1' })).resolves.toEqual({
      bookmarkCount: 7,
      followCount: 3,
      recentBookmarks: [
        {
          articleId: 'article-1',
          bookmarkedAt: new Date('2026-07-23T00:00:00.000Z'),
          article: { id: 'article-1', title: 'Saved article' },
        },
      ],
      recentFollows: [
        {
          followId: 'follow-1',
          objectType: 'JOURNAL',
          objectId: 'journal-1',
          notifyMode: 'IN_APP',
          followedAt: new Date('2026-07-22T00:00:00.000Z'),
          target: {
            type: 'JOURNAL',
            id: 'journal-1',
            displayName: 'Nature',
          },
        },
      ],
      ranking: { year: 2025, metric: 'SJR' },
      catalog: catalogInsights().catalog,
      publicationGrowth: catalogInsights().publicationGrowth,
      yearDistribution: catalogInsights().publicationGrowth,
      trendingTopics: catalogInsights().trendingTopics,
      topJournals: [
        expect.objectContaining({
          scimagoSourceId: 'journal-1',
          journalId: 'S1',
          sjr: 9.2,
        }),
        expect.objectContaining({ scimagoSourceId: 'journal-2', sjr: 3.1 }),
      ],
      recentPublications: catalogInsights().recentPublications,
    });

    expect(bookmarks.countByUser).toHaveBeenCalledWith('user-1');
    expect(follows.countByUser).toHaveBeenCalledWith('user-1');
    expect(listBookmarks.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      page: 1,
      limit: 5,
    });
    expect(listFollows.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      page: 1,
      limit: 5,
    });
  });

  it('returns empty previews for a user without bookmarks or follows', async () => {
    const useCase = new GetDashboardUseCase(
      { countByUser: jest.fn().mockResolvedValue(0) },
      { countByUser: jest.fn().mockResolvedValue(0) },
      {
        execute: jest.fn().mockResolvedValue({
          items: [],
          page: 1,
          limit: 5,
          hasMore: false,
        }),
      } as never,
      {
        execute: jest.fn().mockResolvedValue({
          items: [],
          page: 1,
          limit: 5,
          hasMore: false,
        }),
      } as never,
      {
        getCatalogDashboardInsights: jest
          .fn()
          .mockResolvedValue(catalogInsights()),
      },
      { load: jest.fn().mockResolvedValue(scimagoDataset()) },
      { findByScimagoSourceIds: jest.fn().mockResolvedValue([]) },
    );

    await expect(useCase.execute({ userId: 'user-2' })).resolves.toEqual({
      bookmarkCount: 0,
      followCount: 0,
      recentBookmarks: [],
      recentFollows: [],
      ranking: { year: 2025, metric: 'SJR' },
      catalog: catalogInsights().catalog,
      publicationGrowth: catalogInsights().publicationGrowth,
      yearDistribution: catalogInsights().publicationGrowth,
      trendingTopics: catalogInsights().trendingTopics,
      topJournals: [
        {
          scimagoSourceId: 'journal-1',
          journalId: null,
          title: 'Journal one',
          sjr: 9.2,
          hIndex: 100,
          totalDocs: null,
          countryCode: null,
        },
        {
          scimagoSourceId: 'journal-2',
          journalId: null,
          title: 'Journal two',
          sjr: 3.1,
          hIndex: 30,
          totalDocs: null,
          countryCode: null,
        },
      ],
      recentPublications: catalogInsights().recentPublications,
    });
  });

  it('fails rather than returning a partial dashboard when the ranking dataset is empty', async () => {
    const useCase = new GetDashboardUseCase(
      { countByUser: jest.fn().mockResolvedValue(0) },
      { countByUser: jest.fn().mockResolvedValue(0) },
      {
        execute: jest.fn().mockResolvedValue({
          items: [],
          page: 1,
          limit: 5,
          hasMore: false,
        }),
      } as never,
      {
        execute: jest.fn().mockResolvedValue({
          items: [],
          page: 1,
          limit: 5,
          hasMore: false,
        }),
      } as never,
      {
        getCatalogDashboardInsights: jest
          .fn()
          .mockResolvedValue(catalogInsights()),
      },
      {
        load: jest.fn().mockResolvedValue({
          ...scimagoDataset(),
          years: new Set(),
          records: [],
        }),
      },
      { findByScimagoSourceIds: jest.fn() },
    );

    await expect(useCase.execute({ userId: 'user-2' })).rejects.toThrow(
      'Dashboard data is unavailable',
    );
  });
});

function catalogInsights() {
  return {
    catalog: {
      journalCount: 2,
      articleCount: 10,
      uniqueKeywordCount: 3,
      topicsAndSubjectsCount: 4,
      asOf: '2026-07-23T00:00:00.000Z',
    },
    publicationGrowth: [{ year: 2025, articles: 10 }],
    trendingTopics: [{ name: 'Energy storage', count: 4, changePercent: 100 }],
    recentPublications: [
      {
        id: 'W1',
        title: 'Recent work',
        journal: 'Journal one',
        publicationYear: 2025,
        citationCount: 12,
      },
    ],
  };
}

function scimagoDataset() {
  return {
    years: new Set([2024, 2025]),
    records: [
      {
        year: 2025,
        sourceId: 'journal-2',
        title: 'Journal two',
        type: 'journal',
        issns: [],
        sjr: 3.1,
        hIndex: 30,
        rank: 2,
        bestQuartile: 'Q1',
        categories: [],
        areas: [],
      },
      {
        year: 2025,
        sourceId: 'journal-1',
        title: 'Journal one',
        type: 'journal',
        issns: [],
        sjr: 9.2,
        hIndex: 100,
        rank: 1,
        bestQuartile: 'Q1',
        categories: [],
        areas: [],
      },
    ],
    dictionary: new Map(),
    subjectAreas: [],
    subjectCategories: [],
  };
}

import { ListBookmarksUseCase } from '@/bookmark/application/use-cases/list-bookmarks/list-bookmarks.use-case';
import { BookmarkRepository } from '@/bookmark/application/ports/bookmark.ports';
import {
  GetDashboardInput,
  GetDashboardOutput,
} from '@/dashboard/application/use-cases/get-dashboard/get-dashboard.dto';
import { ListFollowsUseCase } from '@/follow/application/use-cases/list-follows/list-follows.use-case';
import { FollowRepository } from '@/follow/application/ports/follow.ports';
import {
  AcademicGraphRepository,
  AcademicJournalSyncStateRepository,
  ScimagoDatasetReader,
} from '@repo/academic/domain';

const PREVIEW_LIMIT = 5;
const TOP_JOURNAL_LIMIT = 5;

export class DashboardDataUnavailableError extends Error {
  constructor() {
    super('Dashboard data is unavailable');
  }
}

export class GetDashboardUseCase {
  constructor(
    private readonly bookmarks: Pick<BookmarkRepository, 'countByUser'>,
    private readonly follows: Pick<FollowRepository, 'countByUser'>,
    private readonly listBookmarks: ListBookmarksUseCase,
    private readonly listFollows: ListFollowsUseCase,
    private readonly graph: Pick<
      AcademicGraphRepository,
      'getCatalogDashboardInsights'
    >,
    private readonly datasets: ScimagoDatasetReader,
    private readonly journalStates: Pick<
      AcademicJournalSyncStateRepository,
      'findByScimagoSourceIds'
    >,
  ) {}

  async execute(input: GetDashboardInput): Promise<GetDashboardOutput> {
    const personalDashboard = Promise.all([
      this.bookmarks.countByUser(input.userId),
      this.follows.countByUser(input.userId),
      this.listBookmarks.execute({
        userId: input.userId,
        page: 1,
        limit: PREVIEW_LIMIT,
      }),
      this.listFollows.execute({
        userId: input.userId,
        page: 1,
        limit: PREVIEW_LIMIT,
      }),
    ]);
    const [personal, academic] = await Promise.all([
      personalDashboard,
      this.getAcademicDashboard(),
    ]);
    const [bookmarkCount, followCount, bookmarks, follows] = personal;

    return {
      bookmarkCount,
      followCount,
      recentBookmarks: bookmarks.items,
      recentFollows: follows.items,
      ...academic,
    };
  }

  private async getAcademicDashboard(): Promise<
    Pick<
      GetDashboardOutput,
      | 'ranking'
      | 'catalog'
      | 'publicationGrowth'
      | 'yearDistribution'
      | 'trendingTopics'
      | 'topJournals'
      | 'recentPublications'
    >
  > {
    try {
      const [catalog, dataset] = await Promise.all([
        this.graph.getCatalogDashboardInsights(),
        this.datasets.load(),
      ]);
      const topJournals = await this.topJournals(dataset);
      const year = Math.max(...dataset.years);

      return {
        ranking: { year, metric: 'SJR' },
        catalog: catalog.catalog,
        publicationGrowth: catalog.publicationGrowth,
        yearDistribution: catalog.publicationGrowth,
        trendingTopics: catalog.trendingTopics,
        topJournals,
        recentPublications: catalog.recentPublications,
      };
    } catch {
      throw new DashboardDataUnavailableError();
    }
  }

  private async topJournals(
    dataset: Awaited<ReturnType<ScimagoDatasetReader['load']>>,
  ) {
    const year = Math.max(...dataset.years);
    if (!Number.isFinite(year)) {
      throw new DashboardDataUnavailableError();
    }
    const rankings = dataset.records
      .filter(
        (record) =>
          record.year === year &&
          record.type?.trim().toLowerCase() === 'journal',
      )
      .sort(
        (left, right) =>
          (right.sjr ?? Number.NEGATIVE_INFINITY) -
            (left.sjr ?? Number.NEGATIVE_INFINITY) ||
          left.sourceId.localeCompare(right.sourceId),
      )
      .slice(0, TOP_JOURNAL_LIMIT);
    const states = new Map(
      (
        await this.journalStates.findByScimagoSourceIds(
          rankings.map((ranking) => ranking.sourceId),
        )
      ).map((state) => [state.scimagoSourceId, state]),
    );

    return rankings.map((ranking) => {
      const state = states.get(ranking.sourceId);
      return {
        scimagoSourceId: ranking.sourceId,
        journalId:
          state?.matchStatus === 'MATCHED' ? state.openAlexJournalId : null,
        title: ranking.title,
        sjr: ranking.sjr,
        hIndex: ranking.hIndex,
        totalDocs: ranking.totalDocs ?? null,
        countryCode: ranking.countryCode ?? null,
      };
    });
  }
}

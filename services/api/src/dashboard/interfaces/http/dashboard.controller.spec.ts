import {
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DashboardDataUnavailableError } from '@/dashboard/application/use-cases/get-dashboard/get-dashboard.use-case';
import { DashboardController } from '@/dashboard/interfaces/http/dashboard.controller';

describe('DashboardController', () => {
  it('uses only the authenticated user id and returns the standard envelope', async () => {
    const execute = jest.fn().mockResolvedValue({
      bookmarkCount: 2,
      followCount: 1,
      recentBookmarks: [],
      recentFollows: [],
      ranking: { year: 2025, metric: 'SJR' },
      catalog: {
        journalCount: 2,
        articleCount: 5,
        uniqueKeywordCount: 3,
        topicsAndSubjectsCount: 4,
        asOf: null,
      },
      publicationGrowth: [],
      yearDistribution: [],
      trendingTopics: [],
      topJournals: [],
      recentPublications: [],
    });
    const controller = new DashboardController({ execute } as never);

    await expect(
      controller.getCurrentUserDashboard({ userId: 'user-1' } as never),
    ).resolves.toEqual({
      success: true,
      message: 'Dashboard retrieved',
      data: {
        bookmarkCount: 2,
        followCount: 1,
        recentBookmarks: [],
        recentFollows: [],
        ranking: { year: 2025, metric: 'SJR' },
        catalog: {
          journalCount: 2,
          articleCount: 5,
          uniqueKeywordCount: 3,
          topicsAndSubjectsCount: 4,
          asOf: null,
        },
        publicationGrowth: [],
        yearDistribution: [],
        trendingTopics: [],
        topJournals: [],
        recentPublications: [],
      },
    });
    expect(execute).toHaveBeenCalledWith({ userId: 'user-1' });
  });

  it('maps catalog and ranking failures to service unavailable', async () => {
    const controller = new DashboardController({
      execute: jest.fn().mockRejectedValue(new DashboardDataUnavailableError()),
    } as never);

    await expect(
      controller.getCurrentUserDashboard({ userId: 'user-1' } as never),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps dashboard failures to an internal-server response', async () => {
    const controller = new DashboardController({
      execute: jest.fn().mockRejectedValue(new Error('database unavailable')),
    } as never);

    await expect(
      controller.getCurrentUserDashboard({ userId: 'user-1' } as never),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});

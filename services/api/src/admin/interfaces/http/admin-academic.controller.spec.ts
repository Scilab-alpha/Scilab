import { BadRequestException } from '@nestjs/common';
import { AdminAcademicController } from './admin-academic.controller';

describe('AdminAcademicController', () => {
  const service = {
    getDashboardMetrics: jest.fn(),
    listSyncLogs: jest.fn(),
    getSyncLog: jest.fn(),
    listJobs: jest.fn(),
    getJob: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    trigger: jest.fn(),
    cancel: jest.fn(),
    retry: jest.fn(),
    listJournals: jest.fn(),
    getJournal: jest.fn(),
    listArticles: jest.fn(),
    getArticle: jest.fn(),
  };
  const admin = {
    userId: 'a0ad7eb2-4e2f-4f79-bd9d-63a089a2ab09',
    email: 'admin@example.com',
  };

  beforeEach(() => jest.resetAllMocks());

  it('validates sync log filtering and wraps the paged result', async () => {
    service.listSyncLogs.mockResolvedValue({
      items: [],
      pagination: { page: 1 },
    });
    const controller = new AdminAcademicController(service as never);

    await expect(
      controller.listSyncLogs({
        page: '1',
        pageSize: '20',
        source: 'OPENALEX',
      }),
    ).resolves.toEqual({
      success: true,
      message: 'Sync logs retrieved',
      data: { items: [], pagination: { page: 1 } },
    });
    expect(service.listSyncLogs).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 20, source: 'OPENALEX' }),
    );
  });

  it('wraps dashboard metrics in the standard response envelope', async () => {
    service.getDashboardMetrics.mockResolvedValue({
      generatedAt: '2026-07-23T08:00:00.000Z',
      articleCount: 1200,
      journalCount: 42,
      authorCount: 900,
      userCount: 24,
      summary: {
        articleCount: 1200,
        journalCount: 42,
        authorCount: 900,
        userCount: 24,
      },
      users: { byStatus: {}, byRole: {}, registrations: {} },
      engagement: {},
      sync: {},
      growth: {},
      rankings: {},
      dataQuality: {},
      sources: [],
    });
    const controller = new AdminAcademicController(service as never);

    await expect(controller.getDashboardMetrics()).resolves.toEqual({
      success: true,
      message: 'Dashboard metrics retrieved',
      data: {
        generatedAt: '2026-07-23T08:00:00.000Z',
        articleCount: 1200,
        journalCount: 42,
        authorCount: 900,
        userCount: 24,
        summary: {
          articleCount: 1200,
          journalCount: 42,
          authorCount: 900,
          userCount: 24,
        },
        users: { byStatus: {}, byRole: {}, registrations: {} },
        engagement: {},
        sync: {},
        growth: {},
        rankings: {},
        dataQuality: {},
        sources: [],
      },
    });
  });

  it('rejects invalid admin list inputs before querying storage', async () => {
    const controller = new AdminAcademicController(service as never);

    await expect(controller.listArticles({ page: '0' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      controller.listJournals({
        firstCrawledFrom: '2026-07-22T00:00:00Z',
        firstCrawledTo: '2026-07-21T00:00:00Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('forwards the authenticated admin and normalized reason to trigger', async () => {
    service.trigger.mockResolvedValue({ run: { id: 'run-1' } });
    const controller = new AdminAcademicController(service as never);

    await expect(
      controller.trigger('journal-article-sync', admin as never, {
        reason: '  refresh now  ',
      }),
    ).resolves.toEqual({
      success: true,
      message: 'Academic job trigger accepted',
      data: { run: { id: 'run-1' } },
    });
    expect(service.trigger).toHaveBeenCalledWith(
      'journal-article-sync',
      admin,
      'refresh now',
    );
  });
});

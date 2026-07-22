/* Test doubles intentionally model dynamic Prisma and BullMQ boundaries. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ServiceUnavailableException } from '@nestjs/common';
import { AdminAcademicService } from './admin-academic.service';

describe('AdminAcademicService', () => {
  it('returns the complete administration dashboard from PostgreSQL and Neo4j', async () => {
    const executeRead = jest
      .fn()
      .mockImplementation(
        (
          _cypher: string,
          _parameters: unknown,
          mapRecord: (record: {
            toObject(): Record<string, unknown>;
          }) => unknown,
        ) =>
          Promise.resolve({
            records: [
              mapRecord({
                toObject: () => dashboardGraphRow(),
              }),
            ],
          }),
      );
    const prisma = dashboardPrisma();
    const service = new AdminAcademicService(
      prisma as never,
      { executeRead } as never,
      {} as never,
    );

    const result = await service.getDashboardMetrics();

    expect(result).toMatchObject({
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
      users: {
        byStatus: { active: 20, inactive: 3, banned: 1 },
        byRole: { student: 18, researcher: 5, admin: 1 },
        registrations: { last7Days: 4, last30Days: 10 },
      },
      engagement: {
        bookmarkCount: 30,
        followCount: 20,
        unreadNotificationCount: 7,
      },
      sync: {
        runningJobCount: 2,
        failedSyncCountLast24Hours: 1,
        recentLogs: [{ sourceName: 'OpenAlex', insertedCount: 5 }],
      },
      growth: { last7Days: { authorsWithNewArticles: 10 } },
      rankings: { topArticles: [{ id: 'W1', citationCount: 99 }] },
      dataQuality: { missingDoi: 10 },
      sources: [{ name: 'OpenAlex', failedSyncCountLast24Hours: 1 }],
    });
    expect(result.generatedAt).toEqual(expect.any(String));
    expect(executeRead).toHaveBeenCalledWith(
      expect.stringContaining('MATCH (article:Article)'),
      expect.objectContaining({ topLimit: expect.anything() }),
      expect.any(Function),
    );
  });

  it('reports unavailable dashboard metrics when a data store fails', async () => {
    const prisma = dashboardPrisma();
    prisma.user.count.mockReset().mockRejectedValue(new Error());
    const service = new AdminAcademicService(
      prisma as never,
      { executeRead: jest.fn().mockResolvedValue({ records: [] }) } as never,
      {} as never,
    );

    await expect(service.getDashboardMetrics()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('writes a pending audit before pausing a queue and completes it on success', async () => {
    const auditCreate = jest.fn().mockResolvedValue({ id: 'audit-1' });
    const auditUpdate = jest.fn().mockResolvedValue(undefined);
    const controlFind = jest.fn().mockResolvedValue(null);
    const controlUpsert = jest.fn().mockResolvedValue(undefined);
    const runFind = jest.fn().mockResolvedValue(null);
    const pause = jest.fn().mockResolvedValue(undefined);
    const service = new AdminAcademicService(
      {
        academicJobAudit: { create: auditCreate, update: auditUpdate },
        academicJobControl: { findUnique: controlFind, upsert: controlUpsert },
        academicJobRun: { findFirst: runFind },
      } as never,
      {} as never,
      { getQueue: jest.fn().mockReturnValue({ pause }) } as never,
    );

    const result = await service.pause(
      'journal-article-sync',
      {
        userId: 'a0ad7eb2-4e2f-4f79-bd9d-63a089a2ab09',
        email: 'admin@example.com',
      },
      'maintenance',
    );

    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ outcome: 'PENDING', action: 'PAUSE' }),
      }),
    );
    expect(pause).toHaveBeenCalledTimes(1);
    expect(controlUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ isPaused: true }),
        update: expect.objectContaining({ isPaused: true }),
      }),
    );
    expect(auditUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ outcome: 'SUCCESS' }),
      }),
    );
    expect(result).toMatchObject({
      id: 'journal-article-sync',
      status: 'waiting',
    });
  });

  it('records a rejected audit outcome when a transition is invalid', async () => {
    const auditUpdate = jest.fn().mockResolvedValue(undefined);
    const service = new AdminAcademicService(
      {
        academicJobAudit: {
          create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
          update: auditUpdate,
        },
        academicJobControl: { findUnique: jest.fn().mockResolvedValue(null) },
      } as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.resume(
        'journal-article-sync',
        {
          userId: 'a0ad7eb2-4e2f-4f79-bd9d-63a089a2ab09',
          email: 'admin@example.com',
        },
        null,
      ),
    ).rejects.toThrow('not paused');

    expect(auditUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ outcome: 'REJECTED' }),
      }),
    );
  });

  it('does not mutate a queue when the pending audit cannot be created', async () => {
    const pause = jest.fn();
    const service = new AdminAcademicService(
      {
        academicJobAudit: { create: jest.fn().mockRejectedValue(new Error()) },
      } as never,
      {} as never,
      { getQueue: jest.fn().mockReturnValue({ pause }) } as never,
    );

    await expect(
      service.pause(
        'journal-article-sync',
        {
          userId: 'a0ad7eb2-4e2f-4f79-bd9d-63a089a2ab09',
          email: 'admin@example.com',
        },
        null,
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(pause).not.toHaveBeenCalled();
  });

  it('passes pagination values to Neo4j as integers', async () => {
    const parameterCalls: unknown[] = [];
    const executeRead = jest
      .fn()
      .mockImplementation((_cypher: string, parameters: unknown) => {
        parameterCalls.push(parameters);
        return Promise.resolve(
          parameterCalls.length === 1 ? { records: [29137] } : { records: [] },
        );
      });
    const service = new AdminAcademicService(
      {} as never,
      { executeRead } as never,
      {} as never,
    );

    await service.listJournals({ page: 2, pageSize: 20 });

    const parameters = parameterCalls[1] as {
      skip: { toString(): string };
      limit: { toString(): string };
    };
    expect(parameters.skip.toString()).toBe('20');
    expect(parameters.limit.toString()).toBe('20');
  });

  it('pages journals before counting their articles', async () => {
    const executeRead = jest
      .fn()
      .mockResolvedValueOnce({ records: [29137] })
      .mockResolvedValueOnce({ records: [] });
    const service = new AdminAcademicService(
      {} as never,
      { executeRead } as never,
      {} as never,
    );

    await service.listJournals({ page: 1, pageSize: 20 });

    const calls = executeRead.mock.calls as unknown[][];
    const rowsCypher = cypherAt(calls, 1);
    expect(rowsCypher.indexOf('SKIP $skip LIMIT $limit')).toBeLessThan(
      rowsCypher.indexOf('OPTIONAL MATCH (article:Article)'),
    );
  });

  it('counts articles without joining journals and pages before loading authors', async () => {
    const executeRead = jest
      .fn()
      .mockResolvedValueOnce({ records: [1200] })
      .mockResolvedValueOnce({ records: [] });
    const service = new AdminAcademicService(
      {} as never,
      { executeRead } as never,
      {} as never,
    );

    await service.listArticles({
      page: 1,
      pageSize: 20,
      source: 'OPENALEX',
      journalId: 'S123',
    });

    const calls = executeRead.mock.calls as unknown[][];
    const countCypher = cypherAt(calls, 0);
    const rowsCypher = cypherAt(calls, 1);
    expect(countCypher).toContain('EXISTS {');
    expect(countCypher).not.toContain('OPTIONAL MATCH');
    expect(countCypher).not.toContain('count(DISTINCT article)');
    expect(rowsCypher.indexOf('SKIP $skip LIMIT $limit')).toBeLessThan(
      rowsCypher.indexOf('OPTIONAL MATCH (author:Author)'),
    );
    expect(rowsCypher).toContain('article.crawl_source = $source');
    expect(rowsCypher).not.toContain('$source IS NULL');
  });
});

function dashboardPrisma() {
  return {
    user: {
      count: jest
        .fn()
        .mockResolvedValueOnce(24)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(10),
      groupBy: jest.fn().mockImplementation(({ by }: { by: string[] }) =>
        Promise.resolve(
          by[0] === 'status'
            ? [
                { status: 'ACTIVE', _count: { _all: 20 } },
                { status: 'INACTIVE', _count: { _all: 3 } },
                { status: 'BANNED', _count: { _all: 1 } },
              ]
            : [
                { role: 'STUDENT', _count: { _all: 18 } },
                { role: 'RESEARCHER', _count: { _all: 5 } },
                { role: 'ADMIN', _count: { _all: 1 } },
              ],
        ),
      ),
    },
    userBookmark: { count: jest.fn().mockResolvedValue(30) },
    userFollow: { count: jest.fn().mockResolvedValue(20) },
    notification: { count: jest.fn().mockResolvedValue(7) },
    academicJobRun: { count: jest.fn().mockResolvedValue(2) },
    syncLog: {
      count: jest
        .fn()
        .mockImplementation(
          ({ where }: { where?: { status?: unknown } } = {}) =>
            Promise.resolve(where?.status ? 1 : 0),
        ),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'log-1',
          source: 'OPENALEX',
          jobType: 'JOURNAL_ARTICLE_SYNC',
          status: 'SUCCESS',
          startedAt: new Date('2026-07-23T08:00:00.000Z'),
          finishedAt: new Date('2026-07-23T08:02:00.000Z'),
          totalInserted: 5,
          totalUpdated: 4,
          totalErrors: 0,
          config: { apiName: 'OpenAlex' },
        },
      ]),
      groupBy: jest
        .fn()
        .mockResolvedValue([{ configId: 'source-1', _count: { _all: 1 } }]),
    },
    systemConfig: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'source-1',
          apiName: 'OpenAlex',
          isActive: true,
          lastTestedAt: new Date('2026-07-23T07:00:00.000Z'),
          syncLogs: [
            {
              status: 'SUCCESS',
              startedAt: new Date('2026-07-23T08:00:00.000Z'),
            },
          ],
        },
      ]),
    },
  };
}

function dashboardGraphRow(): Record<string, unknown> {
  const neoInt = (value: number) => ({ toNumber: () => value });
  return {
    article_count: neoInt(1200),
    journal_count: neoInt(42),
    author_count: neoInt(900),
    hydrated_articles: neoInt(1100),
    placeholder_articles: neoInt(100),
    missing_doi: neoInt(10),
    missing_abstract: neoInt(12),
    missing_authors: neoInt(4),
    articles_7_days: neoInt(12),
    journals_7_days: neoInt(2),
    authors_7_days: neoInt(10),
    articles_30_days: neoInt(50),
    journals_30_days: neoInt(4),
    authors_30_days: neoInt(40),
    top_journals: [
      { id: 'S1', title: 'Journal One', articleCount: neoInt(20) },
    ],
    top_articles: [
      { id: 'W1', title: 'Article One', citationCount: neoInt(99) },
    ],
  };
}

function cypherAt(calls: unknown[][], index: number): string {
  const value = calls[index]?.[0];
  return typeof value === 'string' ? value : '';
}

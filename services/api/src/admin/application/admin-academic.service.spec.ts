/* Test doubles intentionally model dynamic Prisma and BullMQ boundaries. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ServiceUnavailableException } from '@nestjs/common';
import { AdminAcademicService } from './admin-academic.service';

describe('AdminAcademicService', () => {
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

function cypherAt(calls: unknown[][], index: number): string {
  const value = calls[index]?.[0];
  return typeof value === 'string' ? value : '';
}

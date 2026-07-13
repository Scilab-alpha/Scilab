import { CronExpression } from '@nestjs/schedule';
import { BackfillAcademicSearchDataUseCase } from '@/academic/application/use-cases/backfill-academic-search-data/backfill-academic-search-data.use-case';
import { AcademicBackfillScheduler } from '@/academic/interfaces/schedulers/academic-backfill.scheduler';

describe('AcademicBackfillScheduler', () => {
  const backfill = { execute: jest.fn() };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('runs search-data backfill every day at 02:00 Asia/Bangkok', async () => {
    backfill.execute.mockResolvedValue({
      publishersNormalized: 3,
      citationsUpdated: 12,
      unmatchedArticleIds: [],
    });
    const scheduler = new AcademicBackfillScheduler(
      backfill as unknown as BackfillAcademicSearchDataUseCase,
    );
    const handler: unknown = Object.getOwnPropertyDescriptor(
      AcademicBackfillScheduler.prototype,
      'handleAcademicSearchDataBackfill',
    )?.value;

    if (typeof handler !== 'function') {
      throw new Error('Academic backfill cron handler is unavailable');
    }

    const cronOptions: unknown = Reflect.getMetadata(
      'SCHEDULE_CRON_OPTIONS',
      handler,
    );

    await scheduler.handleAcademicSearchDataBackfill();

    expect(backfill.execute).toHaveBeenCalledTimes(1);
    expect(cronOptions).toEqual({
      cronTime: CronExpression.EVERY_DAY_AT_2AM,
      name: 'academic-search-data-backfill',
      timeZone: 'Asia/Bangkok',
      waitForCompletion: true,
    });
  });
});

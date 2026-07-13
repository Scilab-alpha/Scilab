import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackfillAcademicSearchDataUseCase } from '@/academic/application/use-cases/backfill-academic-search-data/backfill-academic-search-data.use-case';

const ACADEMIC_SCHEDULE_TIME_ZONE = 'Asia/Bangkok';

@Injectable()
export class AcademicBackfillScheduler {
  private readonly logger = new Logger(AcademicBackfillScheduler.name);

  constructor(
    private readonly backfillAcademicSearchData: BackfillAcademicSearchDataUseCase,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'academic-search-data-backfill',
    timeZone: ACADEMIC_SCHEDULE_TIME_ZONE,
    waitForCompletion: true,
  })
  async handleAcademicSearchDataBackfill(): Promise<void> {
    this.logger.log('Academic search-data backfill cron job triggered.');

    const result = await this.backfillAcademicSearchData.execute();

    this.logger.log(
      `Academic search-data backfill completed with ${result.publishersNormalized} publishers normalized and ${result.citationsUpdated} citation counts updated.`,
    );

    if (result.unmatchedArticleIds.length > 0) {
      this.logger.warn(
        `OpenAlex did not return ${result.unmatchedArticleIds.length} article IDs: ${result.unmatchedArticleIds.join(', ')}`,
      );
    }
  }
}

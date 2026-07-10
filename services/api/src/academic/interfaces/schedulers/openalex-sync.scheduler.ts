import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExecuteOpenAlexSyncUseCase } from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.use-case';

@Injectable()
export class OpenAlexSyncScheduler {
  private readonly logger = new Logger(OpenAlexSyncScheduler.name);

  constructor(
    private readonly executeOpenAlexSyncUseCase: ExecuteOpenAlexSyncUseCase,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleOpenAlexSyncPreparation(): Promise<void> {
    this.logger.log('OpenAlex academic synchronization cron job triggered.');

    const result = await this.executeOpenAlexSyncUseCase.execute();

    this.logger.log(
      `OpenAlex sync ${result.status.toLowerCase()} with ${result.totalFetched} fetched, ${result.totalInserted} synced, and ${result.totalErrors} errors.`,
    );
  }
}

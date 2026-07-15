import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OpenAlexConfigReader,
  OpenAlexConfig,
  OpenAlexJournalSyncConfig,
} from '@repo/academic/application/ports/openalex-config.port';

const OPENALEX_API_KEY_CONFIG_KEY = 'OPENALEX_API_KEY';
const OPENALEX_API_BASE_URL_CONFIG_KEY = 'OPENALEX_API_BASE_URL';
const OPENALEX_JOURNAL_BACKFILL_FROM_YEAR_CONFIG_KEY =
  'OPENALEX_JOURNAL_BACKFILL_FROM_YEAR';
const OPENALEX_JOURNAL_DAILY_PAGE_BUDGET_CONFIG_KEY =
  'OPENALEX_JOURNAL_DAILY_PAGE_BUDGET';
const OPENALEX_JOURNAL_MAX_PAGES_PER_PASS_CONFIG_KEY =
  'OPENALEX_JOURNAL_MAX_PAGES_PER_PASS';
const OPENALEX_SOURCE_BATCH_SIZE_CONFIG_KEY = 'OPENALEX_SOURCE_BATCH_SIZE';
const OPENALEX_JOURNAL_BATCH_SIZE_CONFIG_KEY = 'OPENALEX_JOURNAL_BATCH_SIZE';
const OPENALEX_OUTGOING_REFERENCE_BATCH_SIZE_CONFIG_KEY =
  'OPENALEX_OUTGOING_REFERENCE_BATCH_SIZE';
const OPENALEX_RELATED_REFRESH_DAYS_CONFIG_KEY =
  'OPENALEX_RELATED_REFRESH_DAYS';
const OPENALEX_RELATED_ROOT_BATCH_SIZE_CONFIG_KEY =
  'OPENALEX_RELATED_ROOT_BATCH_SIZE';
const OPENALEX_RELATED_ROOT_MAX_BATCHES_CONFIG_KEY =
  'OPENALEX_RELATED_ROOT_MAX_BATCHES';
const OPENALEX_RELATED_TARGET_BATCH_SIZE_CONFIG_KEY =
  'OPENALEX_RELATED_TARGET_BATCH_SIZE';
const OPENALEX_RELATED_TARGET_MAX_BATCHES_CONFIG_KEY =
  'OPENALEX_RELATED_TARGET_MAX_BATCHES';
const OPENALEX_RELATED_TARGET_MAX_ATTEMPTS_CONFIG_KEY =
  'OPENALEX_RELATED_TARGET_MAX_ATTEMPTS';

const DEFAULT_OPENALEX_API_BASE_URL = 'https://api.openalex.org';

@Injectable()
export class OpenAlexEnvConfigReader implements OpenAlexConfigReader {
  constructor(private readonly configService: ConfigService) {}

  getOpenAlexConfig(): OpenAlexConfig {
    return {
      apiKey: this.readOptionalString(OPENALEX_API_KEY_CONFIG_KEY),
      baseUrl:
        this.readOptionalString(OPENALEX_API_BASE_URL_CONFIG_KEY) ??
        DEFAULT_OPENALEX_API_BASE_URL,
    };
  }

  getJournalSyncConfig(): OpenAlexJournalSyncConfig {
    return {
      ...this.getOpenAlexConfig(),
      journalBackfillFromYear: this.readPositiveInteger(
        OPENALEX_JOURNAL_BACKFILL_FROM_YEAR_CONFIG_KEY,
        2020,
        1900,
        new Date().getUTCFullYear(),
      ),
      dailyPageBudget: this.readPositiveInteger(
        OPENALEX_JOURNAL_DAILY_PAGE_BUDGET_CONFIG_KEY,
        1000,
      ),
      maxPagesPerPass: this.readPositiveInteger(
        OPENALEX_JOURNAL_MAX_PAGES_PER_PASS_CONFIG_KEY,
        10,
      ),
      sourceBatchSize: this.readPositiveInteger(
        OPENALEX_SOURCE_BATCH_SIZE_CONFIG_KEY,
        100,
        1,
        100,
      ),
      journalBatchSize: this.readPositiveInteger(
        OPENALEX_JOURNAL_BATCH_SIZE_CONFIG_KEY,
        100,
      ),
      outgoingReferenceBatchSize: this.readPositiveInteger(
        OPENALEX_OUTGOING_REFERENCE_BATCH_SIZE_CONFIG_KEY,
        100,
        1,
        100,
      ),
      relatedRefreshDays: this.readPositiveInteger(
        OPENALEX_RELATED_REFRESH_DAYS_CONFIG_KEY,
        30,
      ),
      relatedRootBatchSize: this.readPositiveInteger(
        OPENALEX_RELATED_ROOT_BATCH_SIZE_CONFIG_KEY,
        100,
        1,
        100,
      ),
      relatedRootMaxBatches: this.readPositiveInteger(
        OPENALEX_RELATED_ROOT_MAX_BATCHES_CONFIG_KEY,
        10,
      ),
      relatedTargetBatchSize: this.readPositiveInteger(
        OPENALEX_RELATED_TARGET_BATCH_SIZE_CONFIG_KEY,
        100,
        1,
        100,
      ),
      relatedTargetMaxBatches: this.readPositiveInteger(
        OPENALEX_RELATED_TARGET_MAX_BATCHES_CONFIG_KEY,
        10,
      ),
      relatedTargetMaxAttempts: this.readPositiveInteger(
        OPENALEX_RELATED_TARGET_MAX_ATTEMPTS_CONFIG_KEY,
        3,
      ),
    };
  }

  private readOptionalString(name: string): string | undefined {
    const value = this.configService.get<string>(name);

    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  private readPositiveInteger(
    name: string,
    fallback: number,
    min = 1,
    max = Number.MAX_SAFE_INTEGER,
  ): number {
    const parsed = Number(this.configService.get<string>(name));

    return Number.isInteger(parsed) && parsed >= min && parsed <= max
      ? parsed
      : fallback;
  }
}

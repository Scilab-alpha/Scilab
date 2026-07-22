import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SemanticScholarConfigReader,
  SemanticScholarSupplementConfig,
} from '@repo/academic/application/ports/semantic-scholar.port';

const DEFAULT_BASE_URL = 'https://api.semanticscholar.org';

@Injectable()
export class SemanticScholarEnvConfigReader
  implements SemanticScholarConfigReader
{
  constructor(private readonly configService: ConfigService) {}

  getSemanticScholarSupplementConfig(): SemanticScholarSupplementConfig {
    return {
      apiKey: this.optionalString('SEMANTIC_SCHOLAR_API_KEY'),
      baseUrl:
        this.optionalString('SEMANTIC_SCHOLAR_API_BASE_URL') ??
        DEFAULT_BASE_URL,
      journalBackfillFromYear: this.positiveInteger(
        'OPENALEX_JOURNAL_BACKFILL_FROM_YEAR',
        2020,
        1900,
        new Date().getUTCFullYear(),
      ),
      newTarget: this.positiveInteger('SEMANTIC_SCHOLAR_NEW_TARGET', 1000),
      relatedTarget: this.positiveInteger(
        'SEMANTIC_SCHOLAR_RELATED_TARGET',
        2000,
      ),
      maxJournalsPerRun: this.positiveInteger(
        'SEMANTIC_SCHOLAR_MAX_JOURNALS_PER_RUN',
        10,
      ),
      maxBulkPagesPerJournal: this.positiveInteger(
        'SEMANTIC_SCHOLAR_MAX_BULK_PAGES_PER_JOURNAL',
        10,
      ),
      maxRecommendationSeeds: this.positiveInteger(
        'SEMANTIC_SCHOLAR_MAX_RECOMMENDATION_SEEDS',
        20,
      ),
      requestsPerSecond: this.positiveInteger(
        'SEMANTIC_SCHOLAR_REQUESTS_PER_SECOND',
        1,
      ),
    };
  }

  private optionalString(name: string): string | undefined {
    const value = this.configService.get<string>(name)?.trim();
    return value || undefined;
  }

  private positiveInteger(
    name: string,
    fallback: number,
    min = 1,
    max = Number.MAX_SAFE_INTEGER,
  ): number {
    const value = Number(this.configService.get<string>(name));
    return Number.isInteger(value) && value >= min && value <= max
      ? value
      : fallback;
  }
}

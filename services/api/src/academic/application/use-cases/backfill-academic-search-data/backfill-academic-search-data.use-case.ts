import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { OpenAlexConfigReader } from '@/academic/application/ports/openalex-config.port';
import {
  OpenAlexWorkRecord,
  OpenAlexWorkSource,
} from '@/academic/application/ports/openalex-work-source.port';
import {
  BackfillAcademicSearchDataInput,
  BackfillAcademicSearchDataOutput,
} from '@/academic/application/use-cases/backfill-academic-search-data/backfill-academic-search-data.dto';
import { normalizeExactName } from '@/academic/domain/normalize-exact-name';

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 100;
const MAX_OPENALEX_ATTEMPTS = 3;

export class BackfillAcademicSearchDataUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graphs: AcademicGraphRepository,
  ) {}

  async execute(
    input: BackfillAcademicSearchDataInput = {},
  ): Promise<BackfillAcademicSearchDataOutput> {
    const batchSize = normalizeBatchSize(input.batchSize);
    const config = this.configReader.getOpenAlexConfig();

    if (!config.apiKey) {
      throw new Error('OPENALEX_API_KEY is required for citation backfill');
    }

    await this.graphs.backfillHydrationStateAndRemoveRegion();

    let publishersNormalized = 0;
    let journalCursor: string | null = null;

    do {
      const page = await this.graphs.listJournalsForPublisherNormalization({
        cursor: journalCursor,
        limit: batchSize,
      });
      const updates = page.items.flatMap((journal) => {
        const normalizedName = normalizeExactName(journal.publisherName);
        return normalizedName ? [{ id: journal.id, normalizedName }] : [];
      });

      await this.graphs.updatePublisherNameNormalizations(updates);
      publishersNormalized += updates.length;
      journalCursor = page.nextCursor;
    } while (journalCursor);

    let citationsUpdated = 0;
    const unmatchedArticleIds: string[] = [];
    let articleCursor: string | null = null;

    do {
      const page = await this.graphs.listHydratedArticleIdsMissingCitation({
        cursor: articleCursor,
        limit: batchSize,
      });

      if (page.items.length > 0) {
        const response = await this.fetchWorksWithRetry(page.items, config);
        const recordsById = new Map(
          response.results.flatMap((work) => {
            const id = normalizeOpenAlexId(work.id);
            return id ? [[id, work] as const] : [];
          }),
        );
        const updates = page.items.flatMap((id) => {
          const work = recordsById.get(id);
          return typeof work?.cited_by_count === 'number'
            ? [{ id, citationCount: work.cited_by_count }]
            : [];
        });

        unmatchedArticleIds.push(
          ...page.items.filter((id) => !recordsById.has(id)),
        );
        await this.graphs.updateArticleCitationCounts(updates);
        citationsUpdated += updates.length;
      }

      articleCursor = page.nextCursor;
    } while (articleCursor);

    return {
      publishersNormalized,
      citationsUpdated,
      unmatchedArticleIds,
    };
  }

  private async fetchWorksWithRetry(
    ids: string[],
    config: ReturnType<OpenAlexConfigReader['getOpenAlexConfig']>,
  ) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_OPENALEX_ATTEMPTS; attempt += 1) {
      try {
        return await this.works.fetchWorksByIds({ ids, config });
      } catch (error) {
        lastError = error;

        if (
          !isRetryableOpenAlexError(error) ||
          attempt === MAX_OPENALEX_ATTEMPTS
        ) {
          throw error;
        }

        await delay(250 * 2 ** (attempt - 1));
      }
    }

    throw lastError;
  }
}

function normalizeBatchSize(value?: number): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return DEFAULT_BATCH_SIZE;
  }

  return Math.min(value, MAX_BATCH_SIZE);
}

function normalizeOpenAlexId(value?: OpenAlexWorkRecord['id']): string | null {
  return value?.replace('https://openalex.org/', '').trim() || null;
}

function isRetryableOpenAlexError(error: unknown): boolean {
  return error instanceof Error && /HTTP (429|5\d\d)/u.test(error.message);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

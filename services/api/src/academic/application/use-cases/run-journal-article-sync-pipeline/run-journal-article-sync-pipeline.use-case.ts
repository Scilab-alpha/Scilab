import { createHash } from 'node:crypto';
import {
  AcademicJournalSyncState,
  AcademicJournalSyncStateRepository,
} from '@/academic/application/ports/academic-journal-sync-state.port';
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import {
  OpenAlexConfigReader,
  OpenAlexJournalSyncConfig,
  getJournalSyncConfig,
} from '@/academic/application/ports/openalex-config.port';
import { OpenAlexPageBudget } from '@/academic/application/ports/openalex-page-budget.port';
import { OpenAlexWorkSource } from '@/academic/application/ports/openalex-work-source.port';
import { transformOpenAlexWorkToArticleGraph } from '@/academic/application/mappers/openalex-work.mapper';
import { RunJournalArticleSyncPipelineOutput } from './run-journal-article-sync-pipeline.dto';

export class RunJournalArticleSyncPipelineUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly states: AcademicJournalSyncStateRepository,
    private readonly works: OpenAlexWorkSource,
    private readonly graph: AcademicGraphRepository,
    private readonly budget: OpenAlexPageBudget,
  ) {}

  async execute(): Promise<RunJournalArticleSyncPipelineOutput> {
    const config = getJournalSyncConfig(this.configReader);
    if (!config.apiKey) {
      throw new Error('OPENALEX_API_KEY is required for journal article sync');
    }
    const states = await this.states.listMatchedForArticleSync(
      config.journalBatchSize,
    );
    const output: RunJournalArticleSyncPipelineOutput = {
      journalsVisited: states.length,
      pagesFetched: 0,
      articlesInserted: 0,
      articlesUpdated: 0,
      cursorsRemaining: 0,
      errors: 0,
    };

    for (const state of states) {
      const result = await this.syncJournal(state, config);
      output.pagesFetched += result.pagesFetched;
      output.articlesInserted += result.articlesInserted;
      output.articlesUpdated += result.articlesUpdated;
      output.errors += result.errors;
      if (result.hasRemainingCursor) {
        output.cursorsRemaining += 1;
      }
      if (result.budgetExhausted) {
        break;
      }
    }
    return output;
  }

  private async syncJournal(
    original: AcademicJournalSyncState,
    config: OpenAlexJournalSyncConfig,
  ): Promise<{
    pagesFetched: number;
    articlesInserted: number;
    articlesUpdated: number;
    errors: number;
    hasRemainingCursor: boolean;
    budgetExhausted: boolean;
  }> {
    if (!original.openAlexJournalId) {
      return {
        pagesFetched: 0,
        articlesInserted: 0,
        articlesUpdated: 0,
        errors: 0,
        hasRemainingCursor: false,
        budgetExhausted: false,
      };
    }
    const journalId = original.openAlexJournalId;
    let state = { ...original };
    const windowFrom = getWindowFrom(state, config);
    const filter = createJournalWorksFilter(journalId, windowFrom);
    const signature = createHash('sha256').update(filter).digest('hex');
    if (state.filterSignature !== signature) {
      state.cursor = '*';
      state.filterSignature = signature;
      state.incrementalWindowFrom = state.initialBackfillComplete
        ? windowFrom
        : null;
    }
    let cursor = state.cursor ?? '*';
    let pagesFetched = 0;
    let articlesInserted = 0;
    let articlesUpdated = 0;

    for (let page = 0; page < config.maxPagesPerPass; page += 1) {
      if (!(await this.budget.tryConsume(config.dailyPageBudget))) {
        return {
          pagesFetched,
          articlesInserted,
          articlesUpdated,
          errors: 0,
          hasRemainingCursor: true,
          budgetExhausted: true,
        };
      }
      try {
        const worksPage = await this.works.fetchWorks({
          config: {
            ...config,
            filter,
            sort: 'publication_date:desc',
            perPage: 100,
          },
          cursor,
        });
        const graphs = worksPage.results
          .map((work) =>
            transformOpenAlexWorkToArticleGraph(work, {
              includeReferences: false,
              includeRelatedWorks: true,
              relatedSyncEligible: true,
            }),
          )
          .filter(
            (graph): graph is NonNullable<typeof graph> => graph !== null,
          );
        const counts = await this.graph.upsertArticleGraphs(graphs);
        pagesFetched += 1;
        articlesInserted += counts.inserted;
        articlesUpdated += counts.updated;

        const nextCursor = worksPage.meta?.next_cursor ?? null;
        if (!nextCursor) {
          state = {
            ...state,
            cursor: null,
            filterSignature: null,
            incrementalWindowFrom: null,
            initialBackfillComplete: true,
            syncMode: 'INCREMENTAL',
            lastSuccessfulAt: new Date(),
            errorDetail: null,
          };
          await this.states.upsert(state);
          return {
            pagesFetched,
            articlesInserted,
            articlesUpdated,
            errors: 0,
            hasRemainingCursor: false,
            budgetExhausted: false,
          };
        }

        cursor = nextCursor;
        state = {
          ...state,
          cursor,
          filterSignature: signature,
          errorDetail: null,
        };
        await this.states.upsert(state);
      } catch (error) {
        await this.states.upsert({
          ...state,
          errorDetail:
            error instanceof Error
              ? error.message
              : 'Unknown article sync error',
        });
        return {
          pagesFetched,
          articlesInserted,
          articlesUpdated,
          errors: 1,
          hasRemainingCursor: true,
          budgetExhausted: false,
        };
      }
    }
    return {
      pagesFetched,
      articlesInserted,
      articlesUpdated,
      errors: 0,
      hasRemainingCursor: true,
      budgetExhausted: false,
    };
  }
}

export function createJournalWorksFilter(
  journalId: string,
  from: Date,
): string {
  return [
    `primary_location.source.id:${journalId}`,
    'type:article',
    `from_publication_date:${toDateOnly(from)}`,
  ].join(',');
}

function getWindowFrom(
  state: AcademicJournalSyncState,
  config: OpenAlexJournalSyncConfig,
): Date {
  if (!state.initialBackfillComplete) {
    return new Date(Date.UTC(config.journalBackfillFromYear, 0, 1));
  }
  if (state.incrementalWindowFrom) {
    return state.incrementalWindowFrom;
  }
  const from = new Date(state.lastSuccessfulAt ?? new Date());
  from.setUTCDate(from.getUTCDate() - 1);
  return from;
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

import { createHash } from 'node:crypto';
import {
  AcademicJournalSyncState,
  AcademicJournalSyncStateRepository,
} from '@repo/academic/application/ports/academic-journal-sync-state.port';
import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import {
  OpenAlexConfigReader,
  OpenAlexJournalSyncConfig,
  getJournalSyncConfig,
} from '@repo/academic/application/ports/openalex-config.port';
import { OpenAlexPageBudget } from '@repo/academic/application/ports/openalex-page-budget.port';
import { OpenAlexWorkSource } from '@repo/academic/application/ports/openalex-work-source.port';
import { PipelineExecutionControl } from '@repo/academic/application/ports/pipeline-execution-control.port';
import { ScimagoDatasetReader } from '@repo/academic/application/ports/scimago-dataset.port';
import { transformOpenAlexWorkToArticleGraph } from '@repo/academic/application/mappers/openalex-work.mapper';
import { compareScimagoRankings } from '@repo/academic/domain/scimago.model';
import { RunJournalArticleSyncPipelineOutput } from './run-journal-article-sync-pipeline.dto';

interface JournalSyncResult {
  pagesAttempted: number;
  pagesFetched: number;
  articlesInserted: number;
  articlesUpdated: number;
  errors: number;
  cursorsRemaining: number;
  budgetExhausted: boolean;
}

interface JournalLaneResult extends JournalSyncResult {
  nextIndex: number;
  journalsVisited: number;
}

export class RunJournalArticleSyncPipelineUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly datasets: ScimagoDatasetReader,
    private readonly states: AcademicJournalSyncStateRepository,
    private readonly works: OpenAlexWorkSource,
    private readonly graph: AcademicGraphRepository,
    private readonly budget: OpenAlexPageBudget,
  ) {}

  async execute(
    control?: PipelineExecutionControl,
  ): Promise<RunJournalArticleSyncPipelineOutput> {
    const config = getJournalSyncConfig(this.configReader);
    if (!config.apiKey) {
      throw new Error('OPENALEX_API_KEY is required for journal article sync');
    }

    const [priorityStates, continuationStates] = await Promise.all([
      this.listPriorityStates(config),
      this.states.listMatchedBackfillContinuations(config.dailyPageBudget),
    ]);
    const output = createOutput();
    const progress = { current: 0, total: config.dailyPageBudget };
    const priorityQuota = Math.floor(
      (config.dailyPageBudget * config.priorityPercent) / 100,
    );

    const priorityFirstPass = await this.runLane({
      states: priorityStates,
      startIndex: 0,
      pageAttemptLimit: priorityQuota,
      maxPagesPerJournal: 1,
      config,
      control,
      progress,
    });
    mergeLane(output, priorityFirstPass, 'priority');

    if (priorityFirstPass.budgetExhausted) {
      return output;
    }

    const continuationPass = await this.runLane({
      states: continuationStates,
      startIndex: 0,
      pageAttemptLimit: config.dailyPageBudget - output.pagesAttempted,
      maxPagesPerJournal: config.maxPagesPerPass,
      config,
      control,
      progress,
    });
    mergeLane(output, continuationPass, 'continuation');

    if (continuationPass.budgetExhausted) {
      return output;
    }

    const priorityBorrowPass = await this.runLane({
      states: priorityStates,
      startIndex: priorityFirstPass.nextIndex,
      pageAttemptLimit: config.dailyPageBudget - output.pagesAttempted,
      maxPagesPerJournal: 1,
      config,
      control,
      progress,
    });
    mergeLane(output, priorityBorrowPass, 'priority');

    return output;
  }

  private async listPriorityStates(
    config: OpenAlexJournalSyncConfig,
  ): Promise<AcademicJournalSyncState[]> {
    const dataset = await this.datasets.load();
    const latestCatalogYear = Math.max(...dataset.years);
    if (!Number.isFinite(latestCatalogYear)) {
      return [];
    }

    const sourceIds = [
      ...new Set(
        dataset.records
          .filter(
            (record) =>
              record.year === latestCatalogYear &&
              record.type?.trim().toLowerCase() === 'journal',
          )
          .sort(compareScimagoRankings)
          .map((record) => record.sourceId),
      ),
    ];
    const priorityStates: AcademicJournalSyncState[] = [];

    for (
      let offset = 0;
      offset < sourceIds.length &&
      priorityStates.length < config.dailyPageBudget;
      offset += config.journalBatchSize
    ) {
      const batch = sourceIds.slice(offset, offset + config.journalBatchSize);
      const states = new Map(
        (await this.states.findByScimagoSourceIds(batch)).map((state) => [
          state.scimagoSourceId,
          state,
        ]),
      );

      for (const sourceId of batch) {
        const state = states.get(sourceId);
        if (
          !state ||
          state.catalogYear !== latestCatalogYear ||
          state.matchStatus !== 'MATCHED' ||
          !state.openAlexJournalId ||
          state.initialBackfillComplete ||
          state.cursor !== null
        ) {
          continue;
        }

        priorityStates.push(state);
        if (priorityStates.length === config.dailyPageBudget) {
          break;
        }
      }
    }

    return priorityStates;
  }

  private async runLane(input: {
    states: AcademicJournalSyncState[];
    startIndex: number;
    pageAttemptLimit: number;
    maxPagesPerJournal: number;
    config: OpenAlexJournalSyncConfig;
    control?: PipelineExecutionControl;
    progress: { current: number; total: number };
  }): Promise<JournalLaneResult> {
    const result: JournalLaneResult = {
      nextIndex: input.startIndex,
      journalsVisited: 0,
      pagesAttempted: 0,
      pagesFetched: 0,
      articlesInserted: 0,
      articlesUpdated: 0,
      errors: 0,
      cursorsRemaining: 0,
      budgetExhausted: false,
    };

    while (
      result.nextIndex < input.states.length &&
      result.pagesAttempted < input.pageAttemptLimit
    ) {
      if (await input.control?.isCancellationRequested()) {
        break;
      }
      const pageLimit = Math.min(
        input.maxPagesPerJournal,
        input.pageAttemptLimit - result.pagesAttempted,
      );
      const journalResult = await this.syncJournal(
        input.states[result.nextIndex],
        input.config,
        pageLimit,
        input.control,
        input.progress,
      );
      result.nextIndex += 1;
      result.pagesAttempted += journalResult.pagesAttempted;
      result.pagesFetched += journalResult.pagesFetched;
      result.articlesInserted += journalResult.articlesInserted;
      result.articlesUpdated += journalResult.articlesUpdated;
      result.errors += journalResult.errors;
      result.cursorsRemaining += journalResult.cursorsRemaining;
      result.budgetExhausted ||= journalResult.budgetExhausted;
      if (journalResult.pagesAttempted > 0) {
        result.journalsVisited += 1;
      }
      if (journalResult.budgetExhausted) {
        break;
      }
    }

    return result;
  }

  private async syncJournal(
    original: AcademicJournalSyncState,
    config: OpenAlexJournalSyncConfig,
    maxPages: number,
    control?: PipelineExecutionControl,
    progress?: { current: number; total: number },
  ): Promise<JournalSyncResult> {
    if (!original.openAlexJournalId) {
      return emptyJournalResult();
    }
    const journalId = original.openAlexJournalId;
    let state = { ...original };
    let persistedState = { ...original };
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
    let pagesAttempted = 0;
    let pagesFetched = 0;
    let articlesInserted = 0;
    let articlesUpdated = 0;

    for (let page = 0; page < maxPages; page += 1) {
      if (await control?.isCancellationRequested()) {
        return {
          pagesAttempted,
          pagesFetched,
          articlesInserted,
          articlesUpdated,
          errors: 0,
          cursorsRemaining: 1,
          budgetExhausted: false,
        };
      }
      if (!(await this.budget.tryConsume(config.dailyPageBudget))) {
        return {
          pagesAttempted,
          pagesFetched,
          articlesInserted,
          articlesUpdated,
          errors: 0,
          cursorsRemaining: 1,
          budgetExhausted: true,
        };
      }
      pagesAttempted += 1;
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
        if (progress) {
          progress.current += 1;
          await control?.reportProgress?.(progress);
        }

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
          persistedState = state;
          return {
            pagesAttempted,
            pagesFetched,
            articlesInserted,
            articlesUpdated,
            errors: 0,
            cursorsRemaining: 0,
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
        persistedState = state;
      } catch (error) {
        await this.states.upsert({
          ...persistedState,
          errorDetail:
            error instanceof Error
              ? error.message
              : 'Unknown article sync error',
        });
        return {
          pagesAttempted,
          pagesFetched,
          articlesInserted,
          articlesUpdated,
          errors: 1,
          cursorsRemaining: 1,
          budgetExhausted: false,
        };
      }
    }
    return {
      pagesAttempted,
      pagesFetched,
      articlesInserted,
      articlesUpdated,
      errors: 0,
      cursorsRemaining: 1,
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

function createOutput(): RunJournalArticleSyncPipelineOutput {
  return {
    journalsVisited: 0,
    priorityJournalsVisited: 0,
    continuationJournalsVisited: 0,
    pagesFetched: 0,
    pagesAttempted: 0,
    priorityPagesFetched: 0,
    continuationPagesFetched: 0,
    priorityPagesAttempted: 0,
    continuationPagesAttempted: 0,
    articlesInserted: 0,
    articlesUpdated: 0,
    cursorsRemaining: 0,
    errors: 0,
  };
}

function mergeLane(
  output: RunJournalArticleSyncPipelineOutput,
  result: JournalLaneResult,
  lane: 'priority' | 'continuation',
): void {
  output.journalsVisited += result.journalsVisited;
  output.pagesFetched += result.pagesFetched;
  output.pagesAttempted += result.pagesAttempted;
  output.articlesInserted += result.articlesInserted;
  output.articlesUpdated += result.articlesUpdated;
  output.errors += result.errors;
  output.cursorsRemaining += result.cursorsRemaining;

  if (lane === 'priority') {
    output.priorityJournalsVisited += result.journalsVisited;
    output.priorityPagesFetched += result.pagesFetched;
    output.priorityPagesAttempted += result.pagesAttempted;
    return;
  }

  output.continuationJournalsVisited += result.journalsVisited;
  output.continuationPagesFetched += result.pagesFetched;
  output.continuationPagesAttempted += result.pagesAttempted;
}

function emptyJournalResult(): JournalSyncResult {
  return {
    pagesAttempted: 0,
    pagesFetched: 0,
    articlesInserted: 0,
    articlesUpdated: 0,
    errors: 0,
    cursorsRemaining: 0,
    budgetExhausted: false,
  };
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

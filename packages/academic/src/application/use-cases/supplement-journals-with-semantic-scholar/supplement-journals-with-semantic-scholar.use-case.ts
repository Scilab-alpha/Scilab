import {
  AcademicJournalSyncState,
  AcademicJournalSyncStateRepository,
  SemanticScholarSupplementStatus,
} from '@repo/academic/application/ports/academic-journal-sync-state.port';
import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import {
  SemanticScholarConfigReader,
  SemanticScholarPaperRecord,
  SemanticScholarPaperSource,
} from '@repo/academic/application/ports/semantic-scholar.port';
import { PipelineExecutionControl } from '@repo/academic/application/ports/pipeline-execution-control.port';
import { ScimagoDatasetReader } from '@repo/academic/application/ports/scimago-dataset.port';
import { transformSemanticScholarPaper } from '@repo/academic/application/mappers/semantic-scholar-paper.mapper';
import {
  compareScimagoRankings,
  ScimagoRecord,
} from '@repo/academic/domain/scimago.model';
import { SupplementJournalsWithSemanticScholarOutput } from './supplement-journals-with-semantic-scholar.dto';

export class SupplementJournalsWithSemanticScholarUseCase {
  constructor(
    private readonly configReader: SemanticScholarConfigReader,
    private readonly datasets: ScimagoDatasetReader,
    private readonly states: AcademicJournalSyncStateRepository,
    private readonly papers: SemanticScholarPaperSource,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(
    control?: PipelineExecutionControl,
  ): Promise<SupplementJournalsWithSemanticScholarOutput> {
    const config = this.configReader.getSemanticScholarSupplementConfig();
    if (!config.apiKey) {
      throw new Error(
        'SEMANTIC_SCHOLAR_API_KEY is required for journal supplementation',
      );
    }

    const candidates = await this.listPriorityCandidates(
      config.maxJournalsPerRun,
    );
    const claimed = await this.states.claimSemanticScholarStates(
      candidates.map(({ state }) => state.scimagoSourceId),
    );
    const records = new Map(
      candidates.map(({ record }) => [record.sourceId, record]),
    );
    const output = createOutput(claimed.length);

    for (const state of claimed) {
      if (await control?.isCancellationRequested()) {
        await this.release(state, 'Supplementation was cancelled');
        break;
      }
      const record = records.get(state.scimagoSourceId);
      if (!record) {
        await this.fail(state, 'SCImago journal record is unavailable');
        continue;
      }
      const result = await this.syncJournal(record, state, control);
      output.bulkPagesFetched += result.bulkPagesFetched;
      output.recommendationCalls += result.recommendationCalls;
      output.newAccepted += result.newAccepted;
      output.relatedAccepted += result.relatedAccepted;
      output.articlesInserted += result.articlesInserted;
      output.articlesUpdated += result.articlesUpdated;
      if (result.completed) {
        output.journalsCompleted += 1;
      } else {
        output.journalsShortfall += 1;
      }
      await control?.reportProgress?.({
        current: output.journalsCompleted + output.journalsShortfall,
        total: output.journalsClaimed,
      });
    }

    return output;
  }

  private async listPriorityCandidates(
    limit: number,
  ): Promise<
    Array<{ record: ScimagoRecord; state: AcademicJournalSyncState }>
  > {
    const dataset = await this.datasets.load();
    const latestYear = Math.max(...dataset.years);
    if (!Number.isFinite(latestYear)) {
      return [];
    }
    const records = dataset.records
      .filter(
        (record) =>
          record.year === latestYear &&
          record.type?.trim().toLowerCase() === 'journal',
      )
      .sort(compareScimagoRankings);
    const states = await this.states.findByScimagoSourceIds(
      records.map((record) => record.sourceId),
    );
    const statesBySourceId = new Map(
      states.map((state) => [state.scimagoSourceId, state]),
    );
    return records
      .flatMap((record) => {
        const state = statesBySourceId.get(record.sourceId);
        if (
          !state ||
          state.matchStatus !== 'MATCHED' ||
          !state.openAlexJournalId ||
          !state.initialBackfillComplete ||
          !isEligibleSemanticScholarState(state)
        ) {
          return [];
        }
        return [{ record, state }];
      })
      .slice(0, limit);
  }

  private async syncJournal(
    record: ScimagoRecord,
    original: AcademicJournalSyncState,
    control?: PipelineExecutionControl,
  ) {
    const config = this.configReader.getSemanticScholarSupplementConfig();
    const journalId = original.openAlexJournalId;
    if (!journalId) {
      await this.fail(original, 'Matched journal has no OpenAlex identifier');
      return emptyJournalOutput();
    }

    let state = { ...original };
    let knownPaperIds = await this.graph.findSemanticScholarDiscoveredPaperIds(
      state.scimagoSourceId,
    );
    let newAccepted = state.semanticScholarNewAccepted ?? 0;
    let relatedAccepted = state.semanticScholarRelatedAccepted ?? 0;
    let inserted = 0;
    let updated = 0;
    let bulkPagesFetched = 0;
    let recommendationCalls = 0;

    try {
      let token = state.semanticScholarNewToken ?? null;
      for (
        let page = 0;
        page < config.maxBulkPagesPerJournal && newAccepted < config.newTarget;
        page += 1
      ) {
        if (await control?.isCancellationRequested()) {
          await this.release(
            {
              ...state,
              semanticScholarNewToken: token,
              semanticScholarNewAccepted: newAccepted,
              semanticScholarRelatedAccepted: relatedAccepted,
            },
            'Supplementation was cancelled',
          );
          return {
            ...emptyJournalOutput(),
            bulkPagesFetched,
            recommendationCalls,
            newAccepted,
            relatedAccepted,
            articlesInserted: inserted,
            articlesUpdated: updated,
          };
        }
        const response = await this.papers.searchBulk({
          config,
          venue: record.title,
          fromYear: config.journalBackfillFromYear,
          sort: 'publicationDate:desc',
          token,
        });
        bulkPagesFetched += 1;
        const selected = selectPapers(
          response.data,
          knownPaperIds,
          config.newTarget - newAccepted,
          {
            scimagoSourceId: state.scimagoSourceId,
            originJournalId: journalId,
            lane: 'NEW',
            expectedVenue: record.title,
            fromYear: config.journalBackfillFromYear,
            requireExpectedVenue: true,
          },
        );
        if (selected.length > 0) {
          const counts =
            await this.graph.upsertSemanticScholarArticleGraphs(selected);
          inserted += counts.inserted;
          updated += counts.updated;
          selected.forEach((graph) =>
            knownPaperIds.add(graph.article.semanticScholarId!),
          );
          newAccepted += selected.length;
        }
        token = response.token ?? null;
        state = {
          ...state,
          semanticScholarNewToken: token,
          semanticScholarNewAccepted: newAccepted,
          semanticScholarRelatedAccepted: relatedAccepted,
          semanticScholarStatus: 'RUNNING',
        };
        await this.states.upsert(state);
        if (!token) {
          break;
        }
      }

      if (await control?.isCancellationRequested()) {
        await this.release(
          {
            ...state,
            semanticScholarNewToken: token,
            semanticScholarNewAccepted: newAccepted,
            semanticScholarRelatedAccepted: relatedAccepted,
          },
          'Supplementation was cancelled',
        );
        return {
          ...emptyJournalOutput(),
          bulkPagesFetched,
          recommendationCalls,
          newAccepted,
          relatedAccepted,
          articlesInserted: inserted,
          articlesUpdated: updated,
        };
      }

      const seedResponse = await this.papers.searchBulk({
        config,
        venue: record.title,
        fromYear: config.journalBackfillFromYear,
        sort: 'citationCount:desc',
      });
      bulkPagesFetched += 1;
      const processedSeeds = new Set(
        state.semanticScholarProcessedSeedIds ?? [],
      );
      const eligibleSeeds = seedResponse.data.flatMap((paper) => {
        const graph = transformSemanticScholarPaper(paper, {
          scimagoSourceId: state.scimagoSourceId,
          originJournalId: journalId,
          lane: 'RELATED',
          expectedVenue: record.title,
          fromYear: config.journalBackfillFromYear,
          requireExpectedVenue: true,
        });
        return graph ? [{ paper, graph }] : [];
      });

      for (const { paper, graph } of eligibleSeeds) {
        if (
          relatedAccepted >= config.relatedTarget ||
          processedSeeds.size >= config.maxRecommendationSeeds
        ) {
          break;
        }
        if (await control?.isCancellationRequested()) {
          await this.release(
            {
              ...state,
              semanticScholarNewToken: token,
              semanticScholarNewAccepted: newAccepted,
              semanticScholarRelatedAccepted: relatedAccepted,
              semanticScholarProcessedSeedIds: [...processedSeeds],
            },
            'Supplementation was cancelled',
          );
          return {
            ...emptyJournalOutput(),
            bulkPagesFetched,
            recommendationCalls,
            newAccepted,
            relatedAccepted,
            articlesInserted: inserted,
            articlesUpdated: updated,
          };
        }
        const seedId = graph.article.semanticScholarId!;
        if (processedSeeds.has(seedId)) {
          continue;
        }
        if (!knownPaperIds.has(seedId)) {
          const counts = await this.graph.upsertSemanticScholarArticleGraphs([
            graph,
          ]);
          inserted += counts.inserted;
          updated += counts.updated;
          knownPaperIds.add(seedId);
          relatedAccepted += 1;
        }
        const recommendations = await this.papers.getRecommendations({
          config,
          positivePaperId: seedId,
          limit: 500,
        });
        recommendationCalls += 1;
        processedSeeds.add(seedId);
        const selected = selectPapers(
          recommendations.recommendedPapers,
          knownPaperIds,
          config.relatedTarget - relatedAccepted,
          {
            scimagoSourceId: state.scimagoSourceId,
            originJournalId: journalId,
            lane: 'RELATED',
            expectedVenue: record.title,
            fromYear: config.journalBackfillFromYear,
            requireExpectedVenue: false,
            relatedFromSemanticScholarId: seedId,
          },
        );
        if (selected.length > 0) {
          const counts =
            await this.graph.upsertSemanticScholarArticleGraphs(selected);
          inserted += counts.inserted;
          updated += counts.updated;
          selected.forEach((candidate) =>
            knownPaperIds.add(candidate.article.semanticScholarId!),
          );
          relatedAccepted += selected.length;
        }
        state = {
          ...state,
          semanticScholarNewToken: token,
          semanticScholarNewAccepted: newAccepted,
          semanticScholarRelatedAccepted: relatedAccepted,
          semanticScholarProcessedSeedIds: [...processedSeeds],
          semanticScholarStatus: 'RUNNING',
        };
        await this.states.upsert(state);
      }

      const completed =
        newAccepted >= config.newTarget &&
        relatedAccepted >= config.relatedTarget;
      await this.states.upsert({
        ...state,
        semanticScholarNewToken: token,
        semanticScholarNewAccepted: newAccepted,
        semanticScholarRelatedAccepted: relatedAccepted,
        semanticScholarStatus: completed
          ? 'COMPLETED'
          : 'COMPLETED_WITH_SHORTFALL',
        semanticScholarCompletedAt: new Date(),
        semanticScholarErrorDetail: null,
      });
      return {
        completed,
        bulkPagesFetched,
        recommendationCalls,
        newAccepted,
        relatedAccepted,
        articlesInserted: inserted,
        articlesUpdated: updated,
      };
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message
          : 'Semantic Scholar supplementation failed';
      const nextState = {
        ...state,
        semanticScholarNewAccepted: newAccepted,
        semanticScholarRelatedAccepted: relatedAccepted,
      };
      if (/HTTP (400|401|403)\b/u.test(detail)) {
        await this.fail(nextState, detail);
      } else {
        await this.release(nextState, detail);
      }
      throw error;
    }
  }

  private async release(
    state: AcademicJournalSyncState,
    detail: string,
  ): Promise<void> {
    await this.states.upsert({
      ...state,
      semanticScholarStatus: 'PENDING',
      semanticScholarErrorDetail: detail,
    });
  }

  private async fail(
    state: AcademicJournalSyncState,
    detail: string,
  ): Promise<void> {
    await this.states.upsert({
      ...state,
      semanticScholarStatus: 'FAILED',
      semanticScholarCompletedAt: new Date(),
      semanticScholarErrorDetail: detail,
    });
  }
}

function selectPapers(
  papers: SemanticScholarPaperRecord[],
  knownPaperIds: Set<string>,
  limit: number,
  input: Parameters<typeof transformSemanticScholarPaper>[1],
) {
  const selected = [] as ReturnType<typeof transformSemanticScholarPaper>[];
  for (const paper of papers) {
    const graph = transformSemanticScholarPaper(paper, input);
    const paperId = graph?.article.semanticScholarId;
    if (!graph || !paperId || knownPaperIds.has(paperId)) {
      continue;
    }
    knownPaperIds.add(paperId);
    selected.push(graph);
    if (selected.length === limit) {
      break;
    }
  }
  return selected.filter(
    (graph): graph is NonNullable<typeof graph> => graph !== null,
  );
}

function isEligibleSemanticScholarState(
  state: AcademicJournalSyncState,
): boolean {
  const status = state.semanticScholarStatus ?? 'PENDING';
  if (status === 'PENDING') {
    return true;
  }
  return (
    status === 'RUNNING' &&
    !!state.semanticScholarStartedAt &&
    state.semanticScholarStartedAt.getTime() <= Date.now() - 24 * 60 * 60 * 1000
  );
}

function createOutput(
  journalsClaimed: number,
): SupplementJournalsWithSemanticScholarOutput {
  return {
    journalsClaimed,
    journalsCompleted: 0,
    journalsShortfall: 0,
    bulkPagesFetched: 0,
    recommendationCalls: 0,
    newAccepted: 0,
    relatedAccepted: 0,
    articlesInserted: 0,
    articlesUpdated: 0,
  };
}

function emptyJournalOutput() {
  return {
    completed: false,
    bulkPagesFetched: 0,
    recommendationCalls: 0,
    newAccepted: 0,
    relatedAccepted: 0,
    articlesInserted: 0,
    articlesUpdated: 0,
  };
}

import { transformOpenAlexWorkToArticleGraph } from '@/academic/application/mappers/openalex-work.mapper';
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { AcademicSyncLogRepository } from '@/academic/application/ports/academic-sync-log.port';
import { JournalRankingRepository } from '@/academic/application/ports/journal-ranking.port';
import { OpenAlexConfigReader } from '@/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@/academic/application/ports/openalex-work-source.port';
import { ScimagoDatasetReader } from '@/academic/application/ports/scimago-dataset.port';
import { matchOpenAlexWorkToScimago } from '@/academic/application/services/scimago-ranking.matcher';
import {
  ExecuteOpenAlexSyncInput,
  ExecuteOpenAlexSyncOutput,
} from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.dto';
import { ScimagoDataset } from '@/academic/domain/scimago.model';

const DEFAULT_MAX_PAGES = 1;

export class ExecuteOpenAlexSyncUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graphs: AcademicGraphRepository,
    private readonly syncLogs: AcademicSyncLogRepository,
    private readonly scimagoDatasets: ScimagoDatasetReader,
    private readonly rankings: JournalRankingRepository,
  ) {}

  async execute(
    input: ExecuteOpenAlexSyncInput = {},
  ): Promise<ExecuteOpenAlexSyncOutput> {
    const configured = this.configReader.getSyncConfig();
    const config = { ...configured, filter: input.filter ?? configured.filter };
    const syncLogId = await this.syncLogs.startOpenAlexScheduledSync({
      startedAt: new Date(),
      apiEndpoint: config.baseUrl,
    });

    let totalFetched = 0;
    let totalInserted = 0;
    let totalErrors = 0;
    let rankingMatched = 0;
    let rankingUnmatched = 0;
    let rankingConflicts = 0;
    let rankingRowsUpserted = 0;
    let nextCursor = input.cursor ?? null;

    try {
      if (!config.apiKey) {
        throw new Error(
          'OpenAlex API key configuration is missing. Set OPENALEX_API_KEY before enabling synchronization.',
        );
      }

      const dataset = await this.loadScimagoDataset();

      if (!dataset) {
        totalErrors += 1;
      }

      const persistedRankingKeys = new Set<string>();
      const maxPages = normalizeMaxPages(input.maxPages);

      for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
        const page = await this.works.fetchWorks({
          config,
          cursor: nextCursor,
        });
        const syncItems = page.results.flatMap((work) => {
          const graph = transformOpenAlexWorkToArticleGraph(work);
          return graph ? [{ graph, work }] : [];
        });

        totalFetched += page.results.length;
        totalErrors += page.results.length - syncItems.length;

        for (const { graph, work } of syncItems) {
          try {
            await this.graphs.upsertArticleGraph(graph);
            totalInserted += 1;

            if (!dataset) {
              continue;
            }

            const match = matchOpenAlexWorkToScimago(work, dataset);

            if (match.status === 'UNMATCHED') {
              rankingUnmatched += 1;
              continue;
            }

            if (match.status === 'CONFLICT') {
              rankingConflicts += 1;
              totalErrors += 1;
              continue;
            }

            const rankingKey = `${match.journalId}|${match.year}|${match.record.sourceId}`;

            if (persistedRankingKeys.has(rankingKey)) {
              continue;
            }

            persistedRankingKeys.add(rankingKey);
            rankingRowsUpserted +=
              await this.rankings.upsertScimagoJournalRanking({
                journalId: match.journalId,
                year: match.year,
                record: match.record,
              });
            rankingMatched += 1;
          } catch {
            totalErrors += 1;
          }
        }

        nextCursor = page.meta?.next_cursor ?? null;

        if (!nextCursor || page.results.length === 0) {
          break;
        }
      }

      const status = totalErrors > 0 ? 'PARTIAL' : 'SUCCESS';

      await this.syncLogs.completeOpenAlexSync(syncLogId, {
        finishedAt: new Date(),
        status,
        totalFetched,
        totalInserted,
        totalUpdated: 0,
        totalErrors,
      });

      return {
        syncLogId,
        totalFetched,
        totalInserted,
        totalUpdated: 0,
        totalErrors,
        rankingMatched,
        rankingUnmatched,
        rankingConflicts,
        rankingRowsUpserted,
        nextCursor,
        status,
      };
    } catch (error) {
      const errorDetail =
        error instanceof Error ? error.message : 'Unknown OpenAlex sync error';

      await this.syncLogs.failOpenAlexSync(syncLogId, {
        finishedAt: new Date(),
        totalFetched,
        totalInserted,
        totalUpdated: 0,
        totalErrors: totalErrors + 1,
        errorDetail,
      });

      return {
        syncLogId,
        totalFetched,
        totalInserted,
        totalUpdated: 0,
        totalErrors: totalErrors + 1,
        rankingMatched,
        rankingUnmatched,
        rankingConflicts,
        rankingRowsUpserted,
        nextCursor,
        status: 'FAILED',
      };
    }
  }

  private async loadScimagoDataset(): Promise<ScimagoDataset | null> {
    try {
      const dataset = await this.scimagoDatasets.load();
      await this.rankings.upsertScimagoTaxonomy({
        subjectAreas: dataset.subjectAreas,
        subjectCategories: dataset.subjectCategories,
      });

      return dataset;
    } catch {
      return null;
    }
  }
}

function normalizeMaxPages(value?: number): number {
  if (!Number.isInteger(value) || !value || value < 1) {
    return DEFAULT_MAX_PAGES;
  }

  return Math.min(value, 10);
}

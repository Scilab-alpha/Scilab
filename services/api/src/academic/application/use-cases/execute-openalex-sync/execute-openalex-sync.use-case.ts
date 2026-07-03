import { transformOpenAlexWorkToArticleGraph } from '@/academic/application/mappers/openalex-work.mapper';
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { AcademicSyncLogRepository } from '@/academic/application/ports/academic-sync-log.port';
import { OpenAlexConfigReader } from '@/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@/academic/application/ports/openalex-work-source.port';
import { ExecuteOpenAlexSyncOutput } from '@/academic/application/use-cases/execute-openalex-sync/execute-openalex-sync.dto';
import { ArticleGraph } from '@/academic/domain/academic-graph.model';

export class ExecuteOpenAlexSyncUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graphs: AcademicGraphRepository,
    private readonly syncLogs: AcademicSyncLogRepository,
  ) {}

  async execute(): Promise<ExecuteOpenAlexSyncOutput> {
    const config = this.configReader.getSyncConfig();
    const syncLogId = await this.syncLogs.startOpenAlexScheduledSync({
      startedAt: new Date(),
      apiEndpoint: config.baseUrl,
    });

    let totalFetched = 0;
    let totalInserted = 0;
    let totalErrors = 0;

    try {
      if (!config.apiKey) {
        throw new Error(
          'OpenAlex API key configuration is missing. Set OPENALEX_API_KEY before enabling synchronization.',
        );
      }

      const page = await this.works.fetchWorks({ config });
      const graphs = page.results
        .map(transformOpenAlexWorkToArticleGraph)
        .filter((graph): graph is ArticleGraph => Boolean(graph));

      totalFetched = page.results.length;
      totalErrors = totalFetched - graphs.length;

      for (const graph of graphs) {
        try {
          await this.graphs.upsertArticleGraph(graph);
          totalInserted += 1;
        } catch {
          totalErrors += 1;
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
        status: 'FAILED',
      };
    }
  }
}

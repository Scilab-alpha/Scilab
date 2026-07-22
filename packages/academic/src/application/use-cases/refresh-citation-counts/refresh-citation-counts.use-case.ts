import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import { OpenAlexConfigReader } from '@repo/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@repo/academic/application/ports/openalex-work-source.port';
import { PipelineExecutionControl } from '@repo/academic/application/ports/pipeline-execution-control.port';
import { RefreshCitationCountsOutput } from '@repo/academic/application/use-cases/refresh-citation-counts/refresh-citation-counts.dto';

const BATCH_SIZE = 100;
const MAX_BATCHES = 10;

export class RefreshCitationCountsUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graphs: AcademicGraphRepository,
  ) {}

  async execute(
    now = new Date(),
    control?: PipelineExecutionControl,
  ): Promise<RefreshCitationCountsOutput> {
    const config = this.configReader.getOpenAlexConfig();

    if (!config.apiKey) {
      throw new Error('OPENALEX_API_KEY is required for citation refresh');
    }

    const staleBefore = new Date(now);
    staleBefore.setUTCHours(staleBefore.getUTCHours() - 6);
    let requested = 0;
    let updated = 0;
    const unmatchedArticleIds: string[] = [];

    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      if (await control?.isCancellationRequested()) {
        break;
      }
      const ids = await this.graphs.listHydratedArticleIdsNeedingCitation({
        limit: BATCH_SIZE,
        staleBefore,
      });

      if (ids.length === 0) {
        break;
      }

      const response = await this.works.fetchWorksByIds({ ids, config });
      const byId = new Map(
        response.results.flatMap((work) => {
          const id = normalizeOpenAlexId(work.id);
          return id ? [[id, work] as const] : [];
        }),
      );
      const updates = ids.flatMap((id) => {
        const work = byId.get(id);
        return typeof work?.cited_by_count === 'number'
          ? [{ id, citationCount: work.cited_by_count }]
          : [];
      });

      unmatchedArticleIds.push(...ids.filter((id) => !byId.has(id)));
      await this.graphs.updateArticleCitationCounts(updates);
      requested += ids.length;
      updated += updates.length;
      await control?.reportProgress?.({ current: requested });

      if (ids.length < BATCH_SIZE) {
        break;
      }
    }

    return { requested, updated, unmatchedArticleIds };
  }
}

function normalizeOpenAlexId(value?: string | null): string | null {
  return value?.replace('https://openalex.org/', '').trim() || null;
}

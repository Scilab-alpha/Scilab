import { transformOpenAlexWorkToArticleGraph } from '@repo/academic/application/mappers/openalex-work.mapper';
import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import { OpenAlexConfigReader } from '@repo/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@repo/academic/application/ports/openalex-work-source.port';
import { PipelineExecutionControl } from '@repo/academic/application/ports/pipeline-execution-control.port';
import { HydrateReferencedWorksOutput } from '@repo/academic/application/use-cases/hydrate-referenced-works/hydrate-referenced-works.dto';

const REFERENCE_BATCH_SIZE = 100;

export class HydrateReferencedWorksUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graphs: AcademicGraphRepository,
  ) {}

  async execute(
    control?: PipelineExecutionControl,
  ): Promise<HydrateReferencedWorksOutput> {
    const config = this.configReader.getOpenAlexConfig();

    if (!config.apiKey) {
      throw new Error('OPENALEX_API_KEY is required for reference hydration');
    }

    if (!this.works.fetchWorkDetailsByIds) {
      throw new Error('OpenAlex client does not support reference hydration');
    }

    const ids =
      await this.graphs.listPlaceholderArticleIds(REFERENCE_BATCH_SIZE);
    const response = await this.works.fetchWorkDetailsByIds({ ids, config });
    let hydrated = 0;
    let processed = 0;

    for (const work of response.results) {
      if (await control?.isCancellationRequested()) {
        break;
      }
      processed += 1;
      const graph = transformOpenAlexWorkToArticleGraph(work, {
        includeReferences: false,
      });

      if (!graph) {
        await control?.reportProgress?.({
          current: processed,
          total: ids.length,
        });
        continue;
      }

      await this.graphs.upsertArticleGraph(graph);
      hydrated += 1;
      await control?.reportProgress?.({
        current: processed,
        total: ids.length,
      });
    }

    return { requested: ids.length, hydrated };
  }
}

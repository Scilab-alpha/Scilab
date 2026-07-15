import { transformOpenAlexWorkToArticleGraph } from '@/academic/application/mappers/openalex-work.mapper';
import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import { OpenAlexConfigReader } from '@/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@/academic/application/ports/openalex-work-source.port';
import { HydrateReferencedWorksOutput } from '@/academic/application/use-cases/hydrate-referenced-works/hydrate-referenced-works.dto';

const REFERENCE_BATCH_SIZE = 100;

export class HydrateReferencedWorksUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graphs: AcademicGraphRepository,
  ) {}

  async execute(): Promise<HydrateReferencedWorksOutput> {
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

    for (const work of response.results) {
      const graph = transformOpenAlexWorkToArticleGraph(work, {
        includeReferences: false,
      });

      if (!graph) {
        continue;
      }

      await this.graphs.upsertArticleGraph(graph);
      hydrated += 1;
    }

    return { requested: ids.length, hydrated };
  }
}

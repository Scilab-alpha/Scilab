import { transformOpenAlexWorkToArticleGraph } from '@repo/academic/application/mappers/openalex-work.mapper';
import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import { OpenAlexConfigReader } from '@repo/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@repo/academic/application/ports/openalex-work-source.port';
import { CrawlIncomingCitationsOutput } from '@repo/academic/application/use-cases/crawl-incoming-citations/crawl-incoming-citations.dto';

const MAX_TARGETS = 25;
const MAX_CITATIONS_PER_TARGET = 100;

export class CrawlIncomingCitationsUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graphs: AcademicGraphRepository,
  ) {}

  async execute(now = new Date()): Promise<CrawlIncomingCitationsOutput> {
    const config = this.configReader.getOpenAlexConfig();

    if (!config.apiKey) {
      throw new Error(
        'OPENALEX_API_KEY is required for incoming citation crawl',
      );
    }

    if (!this.works.fetchCitingWorks) {
      throw new Error(
        'OpenAlex client does not support incoming citation crawl',
      );
    }

    const ingestedSince = new Date(now);
    ingestedSince.setUTCDate(ingestedSince.getUTCDate() - 1);
    const targetIds =
      await this.graphs.listHydratedArticleIdsForIncomingCitation({
        limit: MAX_TARGETS,
        ingestedSince,
      });
    let citingWorks = 0;

    for (const targetId of targetIds) {
      const response = await this.works.fetchCitingWorks({
        config,
        workId: targetId,
        limit: MAX_CITATIONS_PER_TARGET,
      });

      for (const work of response.results) {
        const graph = transformOpenAlexWorkToArticleGraph(work, {
          includeReferences: false,
        });

        if (!graph) {
          continue;
        }

        graph.citedArticleIds = [targetId];
        await this.graphs.upsertArticleGraph(graph);
        citingWorks += 1;
      }

      await this.graphs.markIncomingCitationCrawled([targetId]);
    }

    return { targets: targetIds.length, citingWorks };
  }
}

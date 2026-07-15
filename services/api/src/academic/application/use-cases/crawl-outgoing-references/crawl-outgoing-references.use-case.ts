import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import {
  getJournalSyncConfig,
  OpenAlexConfigReader,
} from '@/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@/academic/application/ports/openalex-work-source.port';
import { transformOpenAlexWorkToArticleGraph } from '@/academic/application/mappers/openalex-work.mapper';
import { CrawlOutgoingReferencesOutput } from './crawl-outgoing-references.dto';

export class CrawlOutgoingReferencesUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(): Promise<CrawlOutgoingReferencesOutput> {
    const config = getJournalSyncConfig(this.configReader);
    const ids =
      await this.graph.listHydratedArticleIdsMissingOutgoingReferences(
        config.outgoingReferenceBatchSize,
      );
    if (ids.length === 0) {
      return { articlesSelected: 0, articlesHydrated: 0, edgesPrepared: 0 };
    }
    if (!this.works.fetchWorkDetailsByIds) {
      throw new Error('OpenAlex work detail source is not configured');
    }
    const page = await this.works.fetchWorkDetailsByIds({ config, ids });
    const graphs = page.results
      .map((work) => transformOpenAlexWorkToArticleGraph(work))
      .filter((graph): graph is NonNullable<typeof graph> => graph !== null);
    await this.graph.upsertArticleGraphs(graphs);
    await this.graph.markOutgoingReferencesCrawled(ids);

    return {
      articlesSelected: ids.length,
      articlesHydrated: graphs.length,
      edgesPrepared: graphs.reduce(
        (total, graph) => total + (graph.citedArticleIds?.length ?? 0),
        0,
      ),
    };
  }
}

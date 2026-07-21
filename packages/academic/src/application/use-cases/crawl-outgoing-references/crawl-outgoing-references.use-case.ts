import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import {
  getJournalSyncConfig,
  OpenAlexConfigReader,
} from '@repo/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@repo/academic/application/ports/openalex-work-source.port';
import { PipelineExecutionControl } from '@repo/academic/application/ports/pipeline-execution-control.port';
import { transformOpenAlexWorkToArticleGraph } from '@repo/academic/application/mappers/openalex-work.mapper';
import { CrawlOutgoingReferencesOutput } from './crawl-outgoing-references.dto';

export class CrawlOutgoingReferencesUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(
    control?: PipelineExecutionControl,
  ): Promise<CrawlOutgoingReferencesOutput> {
    const config = getJournalSyncConfig(this.configReader);
    const ids =
      await this.graph.listHydratedArticleIdsMissingOutgoingReferences(
        config.outgoingReferenceBatchSize,
      );
    if (ids.length === 0) {
      return { articlesSelected: 0, articlesHydrated: 0, edgesPrepared: 0 };
    }
    if (await control?.isCancellationRequested()) {
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
    await control?.reportProgress?.({ current: ids.length, total: ids.length });

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

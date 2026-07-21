import { transformOpenAlexWorkToArticleGraph } from '@repo/academic/application/mappers/openalex-work.mapper';
import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import {
  getRelatedWorkSyncConfig,
  OpenAlexConfigReader,
} from '@repo/academic/application/ports/openalex-config.port';
import {
  OpenAlexWorkRecord,
  OpenAlexWorkSource,
} from '@repo/academic/application/ports/openalex-work-source.port';
import { PipelineExecutionControl } from '@repo/academic/application/ports/pipeline-execution-control.port';
import { HydrateRelatedWorksOutput } from './hydrate-related-works.dto';

export class HydrateRelatedWorksUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(
    control?: PipelineExecutionControl,
  ): Promise<HydrateRelatedWorksOutput> {
    const config = getRelatedWorkSyncConfig(this.configReader);

    if (!config.apiKey) {
      throw new Error(
        'OPENALEX_API_KEY is required for related-work hydration',
      );
    }

    if (!this.works.fetchWorkDetailsByIds) {
      throw new Error(
        'OpenAlex client does not support related-work hydration',
      );
    }

    const ids = await this.graph.listPendingRelatedWorkTargetIds(
      config.relatedTargetBatchSize * config.relatedTargetMaxBatches,
    );
    const output: HydrateRelatedWorksOutput = {
      discarded: 0,
      hydrated: 0,
      requested: ids.length,
    };

    for (const batch of batches(ids, config.relatedTargetBatchSize)) {
      if (await control?.isCancellationRequested()) {
        break;
      }
      const page = await this.works.fetchWorkDetailsByIds({
        config,
        ids: batch,
      });
      const articleGraphs = page.results.flatMap(toArticleGraph);
      const hydratedIds = articleGraphs.map((graph) => graph.article.id);
      const hydratedIdSet = new Set(hydratedIds);
      const rejectedIds = page.results
        .map((work) => normalizeOpenAlexId(work.id))
        .filter((id): id is string => id !== null && !hydratedIdSet.has(id));
      const resolvedIds = new Set([...hydratedIds, ...rejectedIds]);
      const unresolvedIds = batch.filter((id) => !resolvedIds.has(id));

      if (articleGraphs.length > 0) {
        await this.graph.upsertArticleGraphs(articleGraphs);
        await this.graph.activatePendingRelatedWorkTargets(hydratedIds);
      }
      if (rejectedIds.length > 0) {
        await this.graph.discardPendingRelatedWorkTargets(rejectedIds);
      }
      if (unresolvedIds.length > 0) {
        await this.graph.incrementPendingRelatedWorkAttempts(
          unresolvedIds,
          config.relatedTargetMaxAttempts,
        );
      }

      output.hydrated += hydratedIds.length;
      output.discarded += rejectedIds.length;
      await control?.reportProgress?.({
        current: output.hydrated + output.discarded,
        total: output.requested,
      });
    }

    return output;
  }
}

function toArticleGraph(work: OpenAlexWorkRecord) {
  if (work.type !== 'article') {
    return [];
  }

  const graph = transformOpenAlexWorkToArticleGraph(work, {
    includeReferences: false,
    includeRelatedWorks: false,
  });

  return graph ? [graph] : [];
}

function normalizeOpenAlexId(value?: string | null): string | null {
  return value?.replace('https://openalex.org/', '').trim() || null;
}

function batches(values: string[], size: number): string[][] {
  const result: string[][] = [];

  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }

  return result;
}

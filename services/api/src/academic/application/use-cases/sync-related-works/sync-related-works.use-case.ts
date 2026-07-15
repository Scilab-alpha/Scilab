import { AcademicGraphRepository } from '@/academic/application/ports/academic-graph.port';
import {
  getRelatedWorkSyncConfig,
  OpenAlexConfigReader,
} from '@/academic/application/ports/openalex-config.port';
import { OpenAlexWorkSource } from '@/academic/application/ports/openalex-work-source.port';
import { RelatedWorkSnapshot } from '@/academic/domain/academic-graph.model';
import { SyncRelatedWorksOutput } from './sync-related-works.dto';

export class SyncRelatedWorksUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly works: OpenAlexWorkSource,
    private readonly graph: AcademicGraphRepository,
  ) {}

  async execute(): Promise<SyncRelatedWorksOutput> {
    const config = getRelatedWorkSyncConfig(this.configReader);

    if (!config.apiKey) {
      throw new Error('OPENALEX_API_KEY is required for related-work sync');
    }

    if (!this.works.fetchRelatedWorksByIds) {
      throw new Error('OpenAlex client does not support related-work sync');
    }

    await this.graph.backfillRelatedWorkSyncEligibility();

    const ids = await this.graph.listRelatedWorkSyncRootIds({
      limit: config.relatedRootBatchSize * config.relatedRootMaxBatches,
      staleBefore: staleBefore(config.relatedRefreshDays),
    });
    const output: SyncRelatedWorksOutput = {
      batches: 0,
      rootsSelected: ids.length,
      rootsSynced: 0,
    };

    for (const batch of batches(ids, config.relatedRootBatchSize)) {
      const page = await this.works.fetchRelatedWorksByIds({
        config,
        ids: batch,
      });
      const snapshots = page.results.flatMap(toRelatedWorkSnapshot);

      await this.graph.replaceRelatedWorkSnapshots(snapshots);
      output.batches += 1;
      output.rootsSynced += snapshots.length;
    }

    return output;
  }
}

function toRelatedWorkSnapshot(work: {
  id?: string | null;
  related_works?: string[] | null;
  type?: string | null;
}): RelatedWorkSnapshot[] {
  const sourceId = normalizeOpenAlexId(work.id);

  if (!sourceId || work.type !== 'article') {
    return [];
  }

  const seen = new Set<string>();
  const references = (work.related_works ?? []).flatMap((value, index) => {
    const id = normalizeOpenAlexId(value);

    if (!id || id === sourceId || seen.has(id)) {
      return [];
    }

    seen.add(id);
    return [{ id, rank: index + 1 }];
  });

  return [{ sourceId, workType: work.type, references }];
}

function normalizeOpenAlexId(value?: string | null): string | null {
  return value?.replace('https://openalex.org/', '').trim() || null;
}

function staleBefore(refreshDays: number): Date {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() - refreshDays);
  return value;
}

function batches(values: string[], size: number): string[][] {
  const result: string[][] = [];

  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }

  return result;
}

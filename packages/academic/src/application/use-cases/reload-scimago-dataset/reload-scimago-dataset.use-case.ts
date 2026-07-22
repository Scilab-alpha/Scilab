import { JournalRankingRepository } from '@repo/academic/application/ports/journal-ranking.port';
import { CachedScimagoDatasetReader } from '@repo/academic/infrastructure/scimago/cached-scimago-dataset.reader';
import { ReloadScimagoDatasetOutput } from '@repo/academic/application/use-cases/reload-scimago-dataset/reload-scimago-dataset.dto';
import { PipelineExecutionControl } from '@repo/academic/application/ports/pipeline-execution-control.port';

export class ReloadScimagoDatasetUseCase {
  constructor(
    private readonly datasets: CachedScimagoDatasetReader,
    private readonly rankings: JournalRankingRepository,
  ) {}

  async execute(
    control?: PipelineExecutionControl,
  ): Promise<ReloadScimagoDatasetOutput> {
    if (await control?.isCancellationRequested()) {
      return { years: [], records: 0 };
    }
    const dataset = await this.datasets.reload();
    await this.rankings.upsertScimagoTaxonomy({
      subjectAreas: dataset.subjectAreas,
      subjectCategories: dataset.subjectCategories,
    });
    await control?.reportProgress?.({
      current: dataset.records.length,
      total: dataset.records.length,
    });

    return {
      years: [...new Set(dataset.records.map((record) => record.year))].sort(),
      records: dataset.records.length,
    };
  }
}

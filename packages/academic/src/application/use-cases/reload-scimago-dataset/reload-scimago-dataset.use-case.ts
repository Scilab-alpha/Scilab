import { JournalRankingRepository } from '@repo/academic/application/ports/journal-ranking.port';
import { CachedScimagoDatasetReader } from '@repo/academic/infrastructure/scimago/cached-scimago-dataset.reader';
import { ReloadScimagoDatasetOutput } from '@repo/academic/application/use-cases/reload-scimago-dataset/reload-scimago-dataset.dto';

export class ReloadScimagoDatasetUseCase {
  constructor(
    private readonly datasets: CachedScimagoDatasetReader,
    private readonly rankings: JournalRankingRepository,
  ) {}

  async execute(): Promise<ReloadScimagoDatasetOutput> {
    const dataset = await this.datasets.reload();
    await this.rankings.upsertScimagoTaxonomy({
      subjectAreas: dataset.subjectAreas,
      subjectCategories: dataset.subjectCategories,
    });

    return {
      years: [...new Set(dataset.records.map((record) => record.year))].sort(),
      records: dataset.records.length,
    };
  }
}

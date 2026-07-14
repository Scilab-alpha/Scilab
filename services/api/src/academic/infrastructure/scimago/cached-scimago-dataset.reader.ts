import { Injectable } from '@nestjs/common';
import { ScimagoDataset } from '@/academic/domain/scimago.model';
import { FileSystemScimagoDatasetReader } from '@/academic/infrastructure/scimago/filesystem-scimago-dataset.reader';

@Injectable()
export class CachedScimagoDatasetReader {
  private dataset: ScimagoDataset | null = null;

  constructor(private readonly source: FileSystemScimagoDatasetReader) {}

  async load(): Promise<ScimagoDataset> {
    return this.dataset ?? this.reload();
  }

  async reload(): Promise<ScimagoDataset> {
    const next = await this.source.load();
    this.dataset = next;
    return next;
  }
}

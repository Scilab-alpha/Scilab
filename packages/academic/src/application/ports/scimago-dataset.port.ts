import { ScimagoDataset } from '@repo/academic/domain/scimago.model';

export const SCIMAGO_DATASET_READER = Symbol('SCIMAGO_DATASET_READER');
export const SCIMAGO_DATASET_DIRECTORY = Symbol('SCIMAGO_DATASET_DIRECTORY');

export interface ScimagoDatasetReader {
  load(): Promise<ScimagoDataset>;
}

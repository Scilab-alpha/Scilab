import { ScimagoNormalizationReport } from '@/academic/domain/scimago.model';

export interface NormalizeScimagoDatasetsInput {
  rawDirectory: string;
  outputDirectory: string;
}

export interface NormalizeScimagoDatasetsOutput {
  reports: ScimagoNormalizationReport[];
}

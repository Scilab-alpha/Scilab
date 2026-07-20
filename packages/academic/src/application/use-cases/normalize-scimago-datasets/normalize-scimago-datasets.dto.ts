import { ScimagoNormalizationReport } from '@repo/academic/domain/scimago.model';

export interface NormalizeScimagoDatasetsInput {
  rawDirectory: string;
  outputDirectory: string;
}

export interface NormalizeScimagoDatasetsOutput {
  reports: ScimagoNormalizationReport[];
}

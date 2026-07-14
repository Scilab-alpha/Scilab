import { resolve } from 'node:path';
import { NormalizeScimagoDatasetsUseCase } from '@/academic/application/use-cases/normalize-scimago-datasets/normalize-scimago-datasets.use-case';

async function main(): Promise<void> {
  const rawDirectory = resolve(
    process.cwd(),
    process.env.SCIMAGO_RAW_DIR ?? '../../docs/scimagojr/raw',
  );
  const outputDirectory = resolve(
    process.cwd(),
    process.env.SCIMAGO_DATASET_DIR ?? '../../docs/scimagojr/normalized',
  );
  const result = await new NormalizeScimagoDatasetsUseCase().execute({
    rawDirectory,
    outputDirectory,
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

void main();

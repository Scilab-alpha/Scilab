import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NormalizeScimagoDatasetsUseCase } from '@/academic/application/use-cases/normalize-scimago-datasets/normalize-scimago-datasets.use-case';

describe('NormalizeScimagoDatasetsUseCase', () => {
  it('normalizes ISSNs, adds year, and reports collisions without overwriting', async () => {
    const rawDirectory = await mkdtemp(join(tmpdir(), 'scimago-raw-'));
    const outputDirectory = await mkdtemp(join(tmpdir(), 'scimago-output-'));
    const rawFile = join(rawDirectory, 'scimagojr 2025.csv');

    await writeFile(
      rawFile,
      [
        'Rank;Sourceid;Title;Issn;Publisher;Total Docs. (2025);SJR;SJR Best Quartile;H index;Categories;Areas;Publisher',
        '1;one;Journal One;15424863, -;Press;1;1,25;Q1;5;Oncology (Q1);Medicine;Press',
        '2;two;Journal Two;1542-4863;Press;1;0,50;Q2;3;Oncology (Q2);Medicine;Press',
      ].join('\n'),
    );

    const result = await new NormalizeScimagoDatasetsUseCase().execute({
      rawDirectory,
      outputDirectory,
    });
    const normalized = await readFile(
      join(outputDirectory, '2025', 'scimagojr 2025.normalized.csv'),
      'utf8',
    );
    const generatedFiles = await readdir(join(outputDirectory, '2025'));

    expect(result.reports).toHaveLength(1);
    expect(result.reports[0]).toMatchObject({
      rows: 2,
      normalizedFile: '2025/scimagojr 2025.normalized.csv',
      validIssnTokens: 2,
      invalidIssnTokens: [{ sourceId: 'one', value: '-' }],
      collisions: [{ issn: '1542-4863', sourceIds: ['one', 'two'] }],
      collapsedDuplicateColumns: ['Publisher'],
    });
    expect(normalized).toContain('Year;Rank;Sourceid;Title;Issn;Publisher');
    expect(normalized).toContain('2025;1;one;Journal One;1542-4863;Press');
    expect(generatedFiles.sort()).toEqual([
      'scimagojr 2025.normalization-report.json',
      'scimagojr 2025.normalized.csv',
    ]);
  });
});

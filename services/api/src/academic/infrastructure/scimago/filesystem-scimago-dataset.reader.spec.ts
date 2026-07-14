import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  defaultScimagoDatasetDirectory,
  FileSystemScimagoDatasetReader,
} from '@/academic/infrastructure/scimago/filesystem-scimago-dataset.reader';

describe('FileSystemScimagoDatasetReader', () => {
  it('loads normalized datasets and keeps exact year keys', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'scimago-reader-'));
    await mkdir(join(directory, '2025'));
    await writeFile(
      join(directory, '2025', 'scimagojr 2025.normalized.csv'),
      [
        'Year;Sourceid;Title;Type;Issn;Rank;SJR;SJR Best Quartile;H index;Total Docs. (2025);Total Docs. (3years);Total Refs.;Total Citations (3years);Citable Docs. (3years);Citations / Doc. (2years);Ref. / Doc.;%Female;Country;Categories;Areas',
        '2025;1;Journal;journal;1542-4863;1;1,234;Q1;10;12;30;100;50;25;2,5;3,25;45,50;Viet Nam;Oncology (Q1);Medicine',
      ].join('\n'),
    );

    const dataset = await new FileSystemScimagoDatasetReader(directory).load();

    expect(dataset.years).toEqual(new Set([2025]));
    expect(dataset.dictionary.get('2025|1542-4863')).toHaveLength(1);
    expect(dataset.records[0]).toMatchObject({
      title: 'Journal',
      totalDocs: 12,
      totalDocs3Years: 30,
      citationsPerDoc2Years: 2.5,
      refsPerDoc: 3.25,
      femalePercentage: 45.5,
      countryCode: 'VN',
    });
  });

  it('uses the configured normalized root while reader discovers year folders', () => {
    const previousDirectory = process.env.SCIMAGO_DATASET_DIR;
    process.env.SCIMAGO_DATASET_DIR = '/app/docs/scimagojr/normalized';

    try {
      expect(defaultScimagoDatasetDirectory()).toBe(
        '/app/docs/scimagojr/normalized',
      );
    } finally {
      if (previousDirectory === undefined) {
        delete process.env.SCIMAGO_DATASET_DIR;
      } else {
        process.env.SCIMAGO_DATASET_DIR = previousDirectory;
      }
    }
  });
});

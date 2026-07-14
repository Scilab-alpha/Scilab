import { Inject, Injectable } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  SCIMAGO_DATASET_DIRECTORY,
  ScimagoDatasetReader,
} from '@/academic/application/ports/scimago-dataset.port';
import {
  buildScimagoDataset,
  parseScimagoRecord,
  ScimagoDataset,
  ScimagoRecord,
} from '@/academic/domain/scimago.model';
import { normalizeIssn } from '@/academic/domain/normalize-issn';
import { parseSemicolonCsv } from '@/academic/infrastructure/scimago/semicolon-csv';

const YEAR_DIRECTORY_PATTERN = /^\d{4}$/;
const NORMALIZED_FILE_PATTERN = /^scimagojr (\d{4})\.normalized\.csv$/i;

@Injectable()
export class FileSystemScimagoDatasetReader implements ScimagoDatasetReader {
  constructor(
    @Inject(SCIMAGO_DATASET_DIRECTORY) private readonly directory: string,
  ) {}

  async load(): Promise<ScimagoDataset> {
    const entries = await readdir(this.directory, { withFileTypes: true });
    const yearDirectories = entries
      .filter(
        (entry) =>
          entry.isDirectory() && YEAR_DIRECTORY_PATTERN.test(entry.name),
      )
      .map((entry) => entry.name)
      .sort();
    const files = (
      await Promise.all(
        yearDirectories.map(async (yearDirectory) => {
          const yearEntries = await readdir(
            resolve(this.directory, yearDirectory),
            { withFileTypes: true },
          );

          return yearEntries
            .filter(
              (entry) =>
                entry.isFile() && NORMALIZED_FILE_PATTERN.test(entry.name),
            )
            .map((entry) => ({
              name: entry.name,
              yearDirectory,
              path: resolve(this.directory, yearDirectory, entry.name),
            }));
        }),
      )
    ).flat();

    if (files.length === 0) {
      throw new Error(
        `No normalized SCImago CSV files found in ${this.directory}`,
      );
    }

    const records: ScimagoRecord[] = [];
    const datasetYears = new Set<number>();

    for (const file of files) {
      const match = NORMALIZED_FILE_PATTERN.exec(file.name);
      const expectedYear = Number(file.yearDirectory);
      const fileYear = Number(match?.[1]);

      if (fileYear !== expectedYear) {
        throw new Error(
          `Normalized SCImago file ${file.name} is in the wrong year folder`,
        );
      }

      if (datasetYears.has(expectedYear)) {
        throw new Error(
          `Multiple normalized SCImago datasets found for ${expectedYear}`,
        );
      }

      datasetYears.add(expectedYear);
      const contents = await readFile(file.path, 'utf8');
      const rows = parseSemicolonCsv(contents);
      const [header, ...dataRows] = rows;

      if (!header) {
        throw new Error(`Normalized SCImago CSV ${file.name} is empty`);
      }

      ensureRequiredColumns(header, file.name);

      for (const row of dataRows) {
        if (row.length === 1 && row[0] === '') {
          continue;
        }

        if (row.length !== header.length) {
          throw new Error(
            `Normalized SCImago CSV ${file.name} has a malformed row`,
          );
        }

        const rawRecord = toRecord(header, row);
        assertNormalizedIssns(rawRecord.Issn, file.name);
        const record = parseScimagoRecord(rawRecord);

        if (record.year !== expectedYear) {
          throw new Error(
            `Normalized SCImago CSV ${file.name} contains year ${record.year}`,
          );
        }

        records.push(record);
      }
    }

    return buildScimagoDataset(records);
  }
}

export function defaultScimagoDatasetDirectory(): string {
  const configuredDirectory = process.env.SCIMAGO_DATASET_DIR;

  if (configuredDirectory?.startsWith('/')) {
    return configuredDirectory;
  }

  return resolve(
    process.cwd(),
    configuredDirectory ?? '../../docs/scimagojr/normalized',
  );
}

function ensureRequiredColumns(header: string[], fileName: string): void {
  for (const column of [
    'Year',
    'Sourceid',
    'Title',
    'Issn',
    'Rank',
    'SJR',
    'SJR Best Quartile',
    'H index',
    'Categories',
    'Areas',
  ]) {
    if (!header.includes(column)) {
      throw new Error(
        `Normalized SCImago CSV ${fileName} is missing ${column}`,
      );
    }
  }
}

function toRecord(header: string[], row: string[]): Record<string, string> {
  return Object.fromEntries(
    header.map((column, index) => [column, row[index]]),
  );
}

function assertNormalizedIssns(
  value: string | undefined,
  fileName: string,
): void {
  for (const issn of (value ?? '').split(',')) {
    if (issn.trim() && !normalizeIssn(issn)) {
      throw new Error(
        `Normalized SCImago CSV ${fileName} contains an invalid ISSN`,
      );
    }
  }
}

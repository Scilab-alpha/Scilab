import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import {
  buildScimagoDataset,
  parseScimagoRecord,
  ScimagoNormalizationReport,
} from '@/academic/domain/scimago.model';
import { normalizeIssn } from '@/academic/domain/normalize-issn';
import {
  NormalizeScimagoDatasetsInput,
  NormalizeScimagoDatasetsOutput,
} from '@/academic/application/use-cases/normalize-scimago-datasets/normalize-scimago-datasets.dto';
import {
  parseSemicolonCsv,
  stringifySemicolonCsv,
} from '@/academic/infrastructure/scimago/semicolon-csv';

const RAW_FILE_PATTERN = /^scimagojr (\d{4})\.csv$/i;

export class NormalizeScimagoDatasetsUseCase {
  async execute(
    input: NormalizeScimagoDatasetsInput,
  ): Promise<NormalizeScimagoDatasetsOutput> {
    const files = await this.findRawFiles(input.rawDirectory);

    if (files.length === 0) {
      throw new Error(
        `No SCImago raw CSV files found in ${input.rawDirectory}`,
      );
    }

    await mkdir(input.outputDirectory, { recursive: true });

    const reports = await Promise.all(
      files.map((file) => this.normalizeFile(input, file)),
    );

    return { reports };
  }

  private async normalizeFile(
    input: NormalizeScimagoDatasetsInput,
    file: { fileName: string; path: string },
  ): Promise<ScimagoNormalizationReport> {
    const rawContents = await readFile(file.path, 'utf8');
    const [rawHeader, ...rawRows] = parseSemicolonCsv(rawContents);

    if (!rawHeader) {
      throw new Error(`SCImago raw CSV ${file.fileName} is empty`);
    }

    const year = this.getYear(file.fileName, rawHeader);
    const { header, sourceIndexes, duplicateColumnIndexes } =
      this.normalizeHeader(rawHeader);
    const collapsedDuplicateColumns = Object.keys(duplicateColumnIndexes);
    const invalidIssnTokens: ScimagoNormalizationReport['invalidIssnTokens'] =
      [];
    let validIssnTokens = 0;
    const normalizedRows = rawRows.map((rawRow) => {
      if (rawRow.length !== rawHeader.length) {
        throw new Error(`SCImago raw CSV ${file.fileName} has a malformed row`);
      }

      this.assertDuplicateColumnsMatch(
        rawRow,
        duplicateColumnIndexes,
        file.fileName,
      );
      const row = sourceIndexes.map((index) => rawRow[index]);
      const sourceId = row[header.indexOf('Sourceid')]?.trim() ?? '';
      const title = row[header.indexOf('Title')]?.trim() ?? '';
      const issnIndex = header.indexOf('Issn');
      const normalizedIssns = (row[issnIndex] ?? '')
        .split(',')
        .map((value) => {
          const normalized = normalizeIssn(value);

          if (!normalized && value.trim()) {
            invalidIssnTokens.push({ sourceId, title, value: value.trim() });
          }

          if (normalized) {
            validIssnTokens += 1;
          }

          return normalized;
        })
        .filter((value): value is string => Boolean(value));

      row[issnIndex] = [...new Set(normalizedIssns)].join(', ');

      return [String(year), ...row];
    });

    const normalizedHeader = ['Year', ...header];
    const records = normalizedRows.map((row) =>
      parseScimagoRecord(
        Object.fromEntries(
          normalizedHeader.map((key, index) => [key, row[index]]),
        ),
      ),
    );
    const dataset = buildScimagoDataset(records);
    const collisions = [...dataset.dictionary.entries()]
      .filter(
        ([, entries]) =>
          new Set(entries.map((entry) => entry.sourceId)).size > 1,
      )
      .map(([key, entries]) => ({
        issn: key.split('|')[1],
        sourceIds: [...new Set(entries.map((entry) => entry.sourceId))].sort(),
      }));
    const unresolvedCategories = dataset.subjectCategories
      .filter((category) => category.subjectAreaName === null)
      .map((category) => category.displayName);
    const normalizedFile = `scimagojr ${year}.normalized.csv`;
    const reportFile = `scimagojr ${year}.normalization-report.json`;
    const yearDirectory = resolve(input.outputDirectory, String(year));
    const report: ScimagoNormalizationReport = {
      year,
      sourceFile: file.fileName,
      normalizedFile: `${year}/${normalizedFile}`,
      rows: normalizedRows.length,
      validIssnTokens,
      invalidIssnTokens,
      collisions,
      unresolvedCategories,
      collapsedDuplicateColumns,
    };

    await mkdir(yearDirectory, { recursive: true });

    await Promise.all([
      writeFile(
        resolve(yearDirectory, normalizedFile),
        stringifySemicolonCsv([normalizedHeader, ...normalizedRows]),
      ),
      writeFile(
        resolve(yearDirectory, reportFile),
        `${JSON.stringify(report, null, 2)}\n`,
      ),
    ]);

    return report;
  }

  private async findRawFiles(
    rawDirectory: string,
  ): Promise<Array<{ fileName: string; path: string }>> {
    const entries = await readdir(rawDirectory, { withFileTypes: true });
    const files: Array<{ fileName: string; path: string }> = [];

    for (const entry of entries) {
      if (entry.isFile() && RAW_FILE_PATTERN.test(entry.name)) {
        files.push({
          fileName: entry.name,
          path: resolve(rawDirectory, entry.name),
        });
        continue;
      }

      if (!entry.isDirectory()) {
        continue;
      }

      const nestedEntries = await readdir(resolve(rawDirectory, entry.name), {
        withFileTypes: true,
      });

      for (const nestedEntry of nestedEntries) {
        if (nestedEntry.isFile() && RAW_FILE_PATTERN.test(nestedEntry.name)) {
          files.push({
            fileName: nestedEntry.name,
            path: resolve(rawDirectory, entry.name, nestedEntry.name),
          });
        }
      }
    }

    const years = new Set<number>();

    for (const file of files) {
      const match = RAW_FILE_PATTERN.exec(file.fileName);
      const year = Number(match?.[1]);

      if (years.has(year)) {
        throw new Error(`Multiple SCImago raw datasets found for ${year}`);
      }

      years.add(year);
    }

    return files.sort((left, right) =>
      left.fileName.localeCompare(right.fileName),
    );
  }

  private getYear(fileName: string, header: string[]): number {
    const match = RAW_FILE_PATTERN.exec(basename(fileName));
    const year = Number(match?.[1]);

    if (!header.includes(`Total Docs. (${year})`)) {
      throw new Error(
        `SCImago raw CSV ${fileName} does not match year ${year}`,
      );
    }

    return year;
  }

  private normalizeHeader(header: string[]): {
    header: string[];
    sourceIndexes: number[];
    duplicateColumnIndexes: Record<string, number[]>;
  } {
    const firstIndexes = new Map<string, number>();
    const duplicateIndexes = new Map<string, number[]>();

    header.forEach((name, index) => {
      if (!firstIndexes.has(name)) {
        firstIndexes.set(name, index);
      } else {
        const indexes = duplicateIndexes.get(name) ?? [firstIndexes.get(name)!];
        indexes.push(index);
        duplicateIndexes.set(name, indexes);
      }
    });

    const sourceIndexes = [...firstIndexes.values()];

    return {
      header: sourceIndexes.map((index) => header[index]),
      sourceIndexes,
      duplicateColumnIndexes: Object.fromEntries(duplicateIndexes),
    };
  }

  private assertDuplicateColumnsMatch(
    row: string[],
    duplicateColumnIndexes: Record<string, number[]>,
    fileName: string,
  ): void {
    for (const [column, indexes] of Object.entries(duplicateColumnIndexes)) {
      const values = indexes.map((index) => row[index]);

      if (!values.every((value) => value === values[0])) {
        throw new Error(
          `SCImago raw CSV ${fileName} has conflicting ${column} columns`,
        );
      }
    }
  }
}

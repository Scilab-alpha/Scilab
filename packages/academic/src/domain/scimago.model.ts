import { normalizeIssn } from '@repo/academic/domain/normalize-issn';
import { toScimagoCountryCode } from '@repo/academic/domain/scimago-country-code';

export interface ScimagoCategory {
  displayName: string;
  quartile: string | null;
}

export interface ScimagoRecord {
  year: number;
  sourceId: string;
  title: string;
  type?: string | null;
  issns: string[];
  sjr: number | null;
  hIndex: number | null;
  rank: number | null;
  bestQuartile: string | null;
  totalDocs?: number | null;
  totalDocs3Years?: number | null;
  totalRefs?: number | null;
  totalCitations3Years?: number | null;
  citableDocs3Years?: number | null;
  citationsPerDoc2Years?: number | null;
  refsPerDoc?: number | null;
  femalePercentage?: number | null;
  countryCode?: string | null;
  categories: ScimagoCategory[];
  areas: string[];
}

export interface ScimagoSubjectCategory {
  displayName: string;
  subjectAreaName: string | null;
}

export interface ScimagoDataset {
  records: ScimagoRecord[];
  dictionary: Map<string, ScimagoRecord[]>;
  years: Set<number>;
  subjectAreas: string[];
  subjectCategories: ScimagoSubjectCategory[];
}

export function compareScimagoRankings(
  left: ScimagoRecord,
  right: ScimagoRecord,
): number {
  const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;

  return leftRank - rightRank || left.sourceId.localeCompare(right.sourceId);
}

export interface ScimagoNormalizationReport {
  year: number;
  sourceFile: string;
  normalizedFile: string;
  rows: number;
  validIssnTokens: number;
  invalidIssnTokens: Array<{
    sourceId: string;
    title: string;
    value: string;
  }>;
  collisions: Array<{
    issn: string;
    sourceIds: string[];
  }>;
  unresolvedCategories: string[];
  collapsedDuplicateColumns: string[];
}

export function createScimagoDictionaryKey(year: number, issn: string): string {
  return `${year}|${issn}`;
}

export function parseScimagoRecord(row: Record<string, string>): ScimagoRecord {
  const year = parseInteger(row.Year, 'Year');
  const sourceId = requiredValue(row.Sourceid, 'Sourceid');

  return {
    year,
    sourceId,
    title: row.Title?.trim() ?? '',
    type: optionalString(row.Type),
    issns: splitIssns(row.Issn),
    sjr: parseDecimal(row.SJR),
    hIndex: parseOptionalInteger(row['H index']),
    rank: parseOptionalInteger(row.Rank),
    bestQuartile: parseQuartile(row['SJR Best Quartile']),
    totalDocs: parseOptionalInteger(row[`Total Docs. (${year})`]),
    totalDocs3Years: parseOptionalInteger(row['Total Docs. (3years)']),
    totalRefs: parseOptionalInteger(row['Total Refs.']),
    totalCitations3Years: parseOptionalInteger(row['Total Citations (3years)']),
    citableDocs3Years: parseOptionalInteger(row['Citable Docs. (3years)']),
    citationsPerDoc2Years: parseDecimal(row['Citations / Doc. (2years)']),
    refsPerDoc: parseDecimal(row['Ref. / Doc.']),
    femalePercentage: parseDecimal(row['%Female']),
    countryCode: toScimagoCountryCode(row.Country),
    categories: parseCategories(row.Categories),
    areas: splitSemicolonValues(row.Areas),
  };
}

export function buildScimagoDataset(records: ScimagoRecord[]): ScimagoDataset {
  const dictionary = new Map<string, ScimagoRecord[]>();
  const years = new Set<number>();

  for (const record of records) {
    years.add(record.year);

    for (const issn of record.issns) {
      const key = createScimagoDictionaryKey(record.year, issn);
      const entries = dictionary.get(key) ?? [];

      if (!entries.some((entry) => entry.sourceId === record.sourceId)) {
        entries.push(record);
        dictionary.set(key, entries);
      }
    }
  }

  const taxonomy = deriveScimagoTaxonomy(records);

  return {
    records,
    dictionary,
    years,
    subjectAreas: taxonomy.subjectAreas,
    subjectCategories: taxonomy.subjectCategories,
  };
}

export function deriveScimagoTaxonomy(records: ScimagoRecord[]): {
  subjectAreas: string[];
  subjectCategories: ScimagoSubjectCategory[];
} {
  const subjectAreas = new Set<string>();
  const singleAreaEvidence = new Map<string, Set<string>>();
  const categoryNames = new Set<string>();

  for (const record of records) {
    record.areas.forEach((area) => subjectAreas.add(area));

    for (const category of record.categories) {
      categoryNames.add(category.displayName);

      if (record.areas.length === 1) {
        const candidates =
          singleAreaEvidence.get(category.displayName) ?? new Set();
        candidates.add(record.areas[0]);
        singleAreaEvidence.set(category.displayName, candidates);
      }
    }
  }

  return {
    subjectAreas: [...subjectAreas].sort(),
    subjectCategories: [...categoryNames].sort().map((displayName) => {
      const candidates = singleAreaEvidence.get(displayName);

      return {
        displayName,
        subjectAreaName:
          candidates && candidates.size === 1 ? [...candidates][0] : null,
      };
    }),
  };
}

export function splitIssns(value?: string | null): string[] {
  return [
    ...new Set((value ?? '').split(',').map(normalizeIssn).filter(isString)),
  ];
}

function splitSemicolonValues(value?: string | null): string[] {
  return [
    ...new Set(
      (value ?? '')
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function parseCategories(value?: string | null): ScimagoCategory[] {
  return splitSemicolonValues(value).map((category) => {
    const match = /^(.*?)\s*\((Q[1-4])\)$/.exec(category);

    return {
      displayName: (match?.[1] ?? category).trim(),
      quartile: match?.[2] ?? null,
    };
  });
}

function parseQuartile(value?: string | null): string | null {
  const quartile = value?.trim().toUpperCase();
  return quartile && /^Q[1-4]$/.test(quartile) ? quartile : null;
}

function parseDecimal(value?: string | null): number | null {
  const normalized = value?.trim().replace(',', '.');

  if (!normalized) {
    return null;
  }

  const result = Number(normalized);
  return Number.isFinite(result) ? result : null;
}

function parseOptionalInteger(value?: string | null): number | null {
  const normalized = value?.trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }

  return Number(normalized);
}

function optionalString(value?: string | null): string | null {
  return value?.trim() || null;
}

function parseInteger(value: string | undefined, field: string): number {
  const parsed = parseOptionalInteger(value);

  if (parsed === null) {
    throw new Error(`SCImago ${field} must be an integer`);
  }

  return parsed;
}

function requiredValue(value: string | undefined, field: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`SCImago ${field} is required`);
  }

  return normalized;
}

function isString(value: string | null): value is string {
  return Boolean(value);
}

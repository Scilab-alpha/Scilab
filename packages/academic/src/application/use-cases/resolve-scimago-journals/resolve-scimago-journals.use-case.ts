import {
  AcademicJournalSyncState,
  AcademicJournalSyncStateRepository,
} from '@repo/academic/application/ports/academic-journal-sync-state.port';
import { AcademicGraphRepository } from '@repo/academic/application/ports/academic-graph.port';
import {
  getJournalSyncConfig,
  OpenAlexConfigReader,
} from '@repo/academic/application/ports/openalex-config.port';
import {
  OpenAlexJournalSourceRecord,
  OpenAlexSourcesCatalog,
} from '@repo/academic/application/ports/openalex-source.port';
import { JournalRankingRepository } from '@repo/academic/application/ports/journal-ranking.port';
import { ScimagoDatasetReader } from '@repo/academic/application/ports/scimago-dataset.port';
import {
  matchScimagoJournalToOpenAlexSources,
  normalizeOpenAlexSourceId,
} from '@repo/academic/application/services/scimago-journal-source.matcher';
import { JournalNode } from '@repo/academic/domain/academic-graph.model';
import { ScimagoRecord } from '@repo/academic/domain/scimago.model';
import { ResolveScimagoJournalsOutput } from './resolve-scimago-journals.dto';

const HISTORICAL_RANKING_FROM_YEAR = 2023;

export class ResolveScimagoJournalsUseCase {
  constructor(
    private readonly configReader: OpenAlexConfigReader,
    private readonly datasets: ScimagoDatasetReader,
    private readonly sources: OpenAlexSourcesCatalog,
    private readonly states: AcademicJournalSyncStateRepository,
    private readonly graph: AcademicGraphRepository,
    private readonly rankings: JournalRankingRepository,
  ) {}

  async execute(): Promise<ResolveScimagoJournalsOutput> {
    const dataset = await this.datasets.load();
    const catalogYear = Math.max(...dataset.years);
    if (!Number.isFinite(catalogYear)) {
      return {
        catalogYear: 0,
        journals: 0,
        matched: 0,
        unmatched: 0,
        conflicts: 0,
      };
    }

    const journals = uniqueLatestJournalRecords(dataset.records, catalogYear);
    const config = getJournalSyncConfig(this.configReader);
    const issns = [...new Set(journals.flatMap((record) => record.issns))];
    const candidates: OpenAlexJournalSourceRecord[] = [];
    const sourceBatches = chunk(issns, config.sourceBatchSize);
    for (const [index, batch] of sourceBatches.entries()) {
      try {
        const page = await this.sources.fetchSourcesByIssns({
          config,
          issns: batch,
        });
        candidates.push(...page.results);
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : 'Unknown OpenAlex error';
        throw new Error(
          `OpenAlex source batch ${index + 1}/${sourceBatches.length} (${batch.length} ISSNs) failed: ${detail}`,
        );
      }
    }

    await this.rankings.upsertScimagoTaxonomy({
      subjectAreas: dataset.subjectAreas,
      subjectCategories: dataset.subjectCategories,
    });
    const previous = new Map(
      (
        await this.states.findByScimagoSourceIds(
          journals.map((record) => record.sourceId),
        )
      ).map((state) => [state.scimagoSourceId, state]),
    );
    const provisional = journals.map((record) => ({
      record,
      match: matchScimagoJournalToOpenAlexSources(record, candidates),
    }));
    const reverse = new Map<string, string[]>();
    for (const item of provisional) {
      if (item.match.matchedJournalId) {
        const ids = reverse.get(item.match.matchedJournalId) ?? [];
        ids.push(item.record.sourceId);
        reverse.set(item.match.matchedJournalId, ids);
      }
    }

    let matched = 0;
    let unmatched = 0;
    let conflicts = 0;
    const sourceById = new Map(
      candidates
        .map(
          (source) => [normalizeOpenAlexSourceId(source.id), source] as const,
        )
        .filter((entry): entry is [string, OpenAlexJournalSourceRecord] =>
          Boolean(entry[0]),
        ),
    );

    for (const { record, match } of provisional) {
      const isReverseCollision =
        match.matchedJournalId !== null &&
        (reverse.get(match.matchedJournalId)?.length ?? 0) > 1;
      const status =
        isReverseCollision || match.candidateJournalIds.length > 1
          ? 'CONFLICT'
          : match.matchedJournalId
            ? 'MATCHED'
            : 'UNMATCHED';
      const state = resolvedState({
        record,
        previous: previous.get(record.sourceId),
        status,
        match,
      });
      await this.states.upsert(state);

      if (status === 'MATCHED' && match.matchedJournalId) {
        matched += 1;
        const source = sourceById.get(match.matchedJournalId);
        if (source) {
          await this.graph.upsertJournal(
            toJournalNode(record, source, match.matchedJournalId, catalogYear),
          );
        }
        for (const historical of dataset.records.filter(
          (item) =>
            item.sourceId === record.sourceId &&
            item.year >= HISTORICAL_RANKING_FROM_YEAR &&
            item.year <= catalogYear,
        )) {
          await this.rankings.upsertScimagoJournalRanking({
            journalId: match.matchedJournalId,
            year: historical.year,
            record: historical,
          });
        }
      } else if (status === 'CONFLICT') {
        conflicts += 1;
      } else {
        unmatched += 1;
      }
    }

    return {
      catalogYear,
      journals: journals.length,
      matched,
      unmatched,
      conflicts,
    };
  }
}

function resolvedState(input: {
  record: ScimagoRecord;
  previous?: AcademicJournalSyncState;
  status: 'MATCHED' | 'UNMATCHED' | 'CONFLICT';
  match: ReturnType<typeof matchScimagoJournalToOpenAlexSources>;
}): AcademicJournalSyncState {
  const previousIsSameMatch =
    input.status === 'MATCHED' &&
    input.previous?.openAlexJournalId === input.match.matchedJournalId;
  return {
    scimagoSourceId: input.record.sourceId,
    catalogYear: input.record.year,
    openAlexJournalId:
      input.status === 'MATCHED' ? input.match.matchedJournalId : null,
    matchStatus: input.status,
    matchedIssn: input.status === 'MATCHED' ? input.match.matchedIssn : null,
    candidateJournalIds: input.match.candidateJournalIds,
    syncMode: previousIsSameMatch
      ? (input.previous?.syncMode ?? 'BACKFILL')
      : 'BACKFILL',
    cursor: previousIsSameMatch ? (input.previous?.cursor ?? null) : null,
    filterSignature: previousIsSameMatch
      ? (input.previous?.filterSignature ?? null)
      : null,
    incrementalWindowFrom: previousIsSameMatch
      ? (input.previous?.incrementalWindowFrom ?? null)
      : null,
    initialBackfillComplete: previousIsSameMatch
      ? (input.previous?.initialBackfillComplete ?? false)
      : false,
    lastResolvedAt: new Date(),
    lastSuccessfulAt: previousIsSameMatch
      ? (input.previous?.lastSuccessfulAt ?? null)
      : null,
    errorDetail: null,
  };
}

function uniqueLatestJournalRecords(
  records: ScimagoRecord[],
  year: number,
): ScimagoRecord[] {
  const bySourceId = new Map<string, ScimagoRecord>();
  for (const record of records) {
    if (
      record.year !== year ||
      record.type?.trim().toLowerCase() !== 'journal'
    ) {
      continue;
    }
    const existing = bySourceId.get(record.sourceId);
    if (!existing) {
      bySourceId.set(record.sourceId, { ...record, issns: [...record.issns] });
    } else {
      existing.issns = [...new Set([...existing.issns, ...record.issns])];
      existing.categories = [...existing.categories, ...record.categories];
      existing.areas = [...new Set([...existing.areas, ...record.areas])];
    }
  }
  return [...bySourceId.values()].sort((left, right) =>
    left.sourceId.localeCompare(right.sourceId),
  );
}

function toJournalNode(
  record: ScimagoRecord,
  source: OpenAlexJournalSourceRecord,
  id: string,
  catalogYear: number,
): JournalNode {
  return {
    id,
    sourceId: source.id ?? id,
    displayName: source.display_name ?? record.title,
    type: 'journal',
    isOpenAccess: source.is_oa ?? null,
    isOaDiamond: source.is_oa_diamond ?? null,
    coverage: record.areas.join('; ') || null,
    country: source.country_code ?? record.countryCode ?? null,
    issnList: [
      ...new Set(
        [...record.issns, source.issn_l, ...(source.issn ?? [])].filter(
          (value): value is string => Boolean(value),
        ),
      ),
    ],
    publisherName: source.host_organization_name ?? source.publisher ?? null,
    publisherImageUrl: null,
    subjectCategories: record.categories.map(
      (category) => category.displayName,
    ),
    scimagoSourceId: record.sourceId,
    scimagoCatalogYear: catalogYear,
  };
}

function chunk<T>(values: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, (index + 1) * size),
  );
}

import { ScimagoDatasetReader } from '@/academic/application/ports/scimago-dataset.port';
import {
  JournalRankingListItem,
  ListJournalRankingsInput,
  ListJournalRankingsOutput,
} from '@/academic/application/use-cases/list-journal-rankings/list-journal-rankings.dto';
import { ScimagoRecord } from '@/academic/domain/scimago.model';

export class JournalRankingDatasetNotFoundError extends Error {
  constructor(year: number) {
    super(`SCImago ranking dataset for ${year} was not found`);
  }
}

export class InvalidJournalRankingCursorError extends Error {
  constructor() {
    super('cursor is invalid for this journal ranking year');
  }
}

export class ListJournalRankingsUseCase {
  constructor(private readonly datasets: ScimagoDatasetReader) {}

  async execute(
    input: ListJournalRankingsInput,
  ): Promise<ListJournalRankingsOutput> {
    const dataset = await this.datasets.load();

    if (!dataset.years.has(input.year)) {
      throw new JournalRankingDatasetNotFoundError(input.year);
    }

    const records = dataset.records
      .filter((record) => record.year === input.year)
      .sort(compareScimagoRankings);
    const startIndex = this.getStartIndex(records, input.cursor);
    const pageRecords = records.slice(startIndex, startIndex + input.limit);
    const hasNextPage = startIndex + input.limit < records.length;

    return {
      items: pageRecords.map(toJournalRankingListItem),
      nextCursor:
        hasNextPage && pageRecords.length > 0
          ? pageRecords[pageRecords.length - 1].sourceId
          : null,
    };
  }

  private getStartIndex(
    records: ScimagoRecord[],
    cursor: string | null,
  ): number {
    if (!cursor) {
      return 0;
    }

    const cursorIndex = records.findIndex(
      (record) => record.sourceId === cursor,
    );

    if (cursorIndex < 0) {
      throw new InvalidJournalRankingCursorError();
    }

    return cursorIndex + 1;
  }
}

function compareScimagoRankings(
  left: ScimagoRecord,
  right: ScimagoRecord,
): number {
  const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
  const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;

  return leftRank - rightRank || left.sourceId.localeCompare(right.sourceId);
}

function toJournalRankingListItem(
  record: ScimagoRecord,
): JournalRankingListItem {
  return {
    title: record.title,
    type: record.type ?? null,
    sjr: record.sjr,
    hIndex: record.hIndex,
    totalDocs: record.totalDocs ?? null,
    totalDocs3Years: record.totalDocs3Years ?? null,
    totalRefs: record.totalRefs ?? null,
    totalCitations3Years: record.totalCitations3Years ?? null,
    citableDocs3Years: record.citableDocs3Years ?? null,
    citationsPerDoc2Years: record.citationsPerDoc2Years ?? null,
    refsPerDoc: record.refsPerDoc ?? null,
    femalePercentage: record.femalePercentage ?? null,
    countryCode: record.countryCode ?? null,
  };
}

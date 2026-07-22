import { SemanticScholarPaperRecord } from '@repo/academic/application/ports/semantic-scholar.port';
import { normalizeExactName } from '@repo/academic/domain/normalize-exact-name';
import { SemanticScholarArticleGraph } from '@repo/academic/domain/academic-graph.model';

export function transformSemanticScholarPaper(
  paper: SemanticScholarPaperRecord,
  input: {
    scimagoSourceId: string;
    originJournalId: string;
    lane: SemanticScholarArticleGraph['lane'];
    expectedVenue: string;
    fromYear: number;
    requireExpectedVenue: boolean;
    relatedFromSemanticScholarId?: string | null;
  },
): SemanticScholarArticleGraph | null {
  const paperId = paper.paperId?.trim();
  const doi = normalizeDoi(paper.externalIds?.DOI);
  const title = paper.title?.trim();
  const publicationYear = paper.year ?? publicationYearFromDate(paper.publicationDate);

  if (
    !paperId ||
    !doi ||
    !title ||
    !publicationYear ||
    publicationYear < input.fromYear ||
    !paper.publicationTypes?.includes('JournalArticle')
  ) {
    return null;
  }

  const venueName = paper.publicationVenue?.name ?? paper.venue ?? null;
  const venueMatches =
    normalizeExactName(venueName) === normalizeExactName(input.expectedVenue);

  if (input.requireExpectedVenue && !venueMatches) {
    return null;
  }

  return {
    article: {
      id: `S2:${paperId}`,
      semanticScholarId: paperId,
      title,
      abstract: paper.abstract?.trim() || null,
      doi,
      publicationYear,
      citationCount: paper.citationCount ?? null,
      semanticScholarCitationCount: paper.citationCount ?? null,
      semanticScholarVenueName: venueName,
      workType: 'article',
      hydrationState: 'HYDRATED',
      relatedSyncEligible: false,
      createdAt: paper.publicationDate ?? null,
      updatedAt: null,
    },
    scimagoSourceId: input.scimagoSourceId,
    originJournalId: input.originJournalId,
    lane: input.lane,
    attachOriginJournal: venueMatches,
    relatedFromSemanticScholarId: input.relatedFromSemanticScholarId ?? null,
  };
}

function publicationYearFromDate(value?: string | null): number | null {
  const match = /^(\d{4})/u.exec(value ?? '');
  return match ? Number(match[1]) : null;
}

function normalizeDoi(value?: string | null): string | null {
  const normalized = value?.replace(/^https?:\/\/doi\.org\//iu, '').trim();
  return normalized || null;
}

import { OpenAlexWorkRecord } from '@/academic/application/ports/openalex-work-source.port';
import {
  ArticleGraph,
  AuthorNode,
  JournalNode,
  KeywordNode,
  TopicNode,
} from '@/academic/domain/academic-graph.model';

export function transformOpenAlexWorkToArticleGraph(
  work: OpenAlexWorkRecord,
  options: {
    includeReferences?: boolean;
    includeRelatedWorks?: boolean;
    relatedSyncEligible?: boolean;
  } = {},
): ArticleGraph | null {
  const articleId = normalizeOpenAlexId(work.id);
  const title = work.title ?? work.display_name;

  if (!articleId || !title) {
    return null;
  }

  const source = work.primary_location?.source;
  const primaryTopicId = normalizeOpenAlexId(work.primary_topic?.id);

  return {
    article: {
      id: articleId,
      title,
      abstract: reconstructAbstract(work.abstract_inverted_index),
      doi: normalizeDoi(work.doi),
      publicationYear: work.publication_year ?? null,
      version: work.version ?? work.type ?? null,
      volumeNumber: work.biblio?.volume ?? null,
      issueNumber: work.biblio?.issue ?? null,
      citationCount: work.cited_by_count ?? null,
      workType: work.type ?? null,
      relatedSyncEligible: options.relatedSyncEligible,
      hydrationState: 'HYDRATED',
      createdAt: work.created_date ?? null,
      updatedAt: work.updated_date ?? null,
    },
    journal: source ? transformSource(source, work) : null,
    authors: transformAuthors(work),
    keywords: transformKeywords(work),
    topics: transformTopics(work, primaryTopicId),
    citedArticleIds:
      options.includeReferences === false
        ? []
        : (work.referenced_works ?? [])
            .map(normalizeOpenAlexId)
            .filter((id): id is string => Boolean(id)),
    relatedWorkReferences: options.includeRelatedWorks
      ? toRelatedWorkReferences(work.related_works, articleId)
      : undefined,
  };
}

function toRelatedWorkReferences(
  relatedWorks: string[] | null | undefined,
  sourceId: string,
) {
  const seen = new Set<string>();

  return (relatedWorks ?? []).flatMap((relatedWork, index) => {
    const id = normalizeOpenAlexId(relatedWork);

    if (!id || id === sourceId || seen.has(id)) {
      return [];
    }

    seen.add(id);
    return [{ id, rank: index + 1 }];
  });
}

function transformSource(
  source: NonNullable<OpenAlexWorkRecord['primary_location']>['source'],
  work: OpenAlexWorkRecord,
): JournalNode | null {
  if (!source) {
    return null;
  }

  const id = normalizeOpenAlexId(source.id);

  if (!id) {
    return null;
  }

  const subjectCategories = [
    work.primary_topic?.field?.display_name,
    work.primary_topic?.domain?.display_name,
  ].filter((value): value is string => Boolean(value));

  return {
    id,
    sourceId: source.id ?? null,
    displayName: source.display_name ?? null,
    type: source.type ?? null,
    isOpenAccess:
      work.open_access?.is_oa ?? work.primary_location?.is_oa ?? null,
    isOaDiamond: null,
    coverage: null,
    country: source.country_code ?? null,
    issnList: source.issn ?? (source.issn_l ? [source.issn_l] : null),
    publisherName: source.host_organization_name ?? source.publisher ?? null,
    publisherImageUrl: null,
    subjectCategories:
      subjectCategories.length > 0 ? [...new Set(subjectCategories)] : null,
  };
}

function transformAuthors(work: OpenAlexWorkRecord): AuthorNode[] {
  return (work.authorships ?? []).flatMap((authorship, index) => {
    const author = authorship.author;
    const id = normalizeOpenAlexId(author?.id);

    if (!author || !id) {
      return [];
    }

    return [
      {
        id,
        orcid: author.orcid ?? null,
        displayName: author.display_name ?? null,
        imageUrl: null,
        authorPosition: index + 1,
      },
    ];
  });
}

function transformKeywords(work: OpenAlexWorkRecord): KeywordNode[] {
  return (work.keywords ?? []).flatMap((keyword) => {
    const id = normalizeOpenAlexId(keyword.id);

    if (!id) {
      return [];
    }

    return [
      {
        id,
        displayName: keyword.display_name ?? null,
        score: keyword.score ?? null,
      },
    ];
  });
}

function transformTopics(
  work: OpenAlexWorkRecord,
  primaryTopicId: string | null,
): TopicNode[] {
  return (work.topics ?? []).flatMap((topic, index) => {
    const id = normalizeOpenAlexId(topic.id);

    if (!id) {
      return [];
    }

    return [
      {
        id,
        displayName: topic.display_name ?? null,
        score: topic.score ?? null,
        isPrimary: primaryTopicId ? id === primaryTopicId : index === 0,
      },
    ];
  });
}

function reconstructAbstract(
  invertedIndex?: Record<string, number[]> | null,
): string | null {
  if (!invertedIndex) {
    return null;
  }

  const wordsByPosition: string[] = [];

  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) {
      wordsByPosition[position] = word;
    }
  }

  const abstract = wordsByPosition.filter(Boolean).join(' ').trim();

  return abstract.length > 0 ? abstract : null;
}

function normalizeOpenAlexId(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.replace('https://openalex.org/', '').trim() || null;
}

function normalizeDoi(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.replace('https://doi.org/', '').trim() || null;
}

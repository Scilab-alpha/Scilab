import type { ArticleListParams } from "@/types/academic.type";
import type { ArticleFilters } from "@/features/search/types/search.type";
import { parseArticleTermFilterValue } from "@/features/search/utils/search-filtering";

export function getArticleQueryParams(
  keyword: string,
  filters: ArticleFilters,
): Omit<ArticleListParams, "cursor" | "limit"> {
  const q = keyword.trim() || null;
  const termFilter = getServerTermFilter(filters.keywords);
  const yearFilter = getServerYearFilter(filters);
  const hasResearchQuery = Boolean(
    q || termFilter.keywordId || termFilter.topicId,
  );
  const sort =
    filters.sort === "relevant" && !hasResearchQuery ? "newest" : filters.sort;

  return {
    q,
    ...termFilter,
    ...yearFilter,
    sort,
  };
}

export function getNextYearFrom(
  nextFrom: string | null,
  currentTo: string | null,
) {
  if (!nextFrom || !currentTo) {
    return nextFrom;
  }

  return Number(nextFrom) <= Number(currentTo) ? nextFrom : null;
}

export function getNextYearToForFrom(
  nextFrom: string | null,
  currentTo: string | null,
) {
  if (!nextFrom || !currentTo) {
    return currentTo;
  }

  return Number(nextFrom) <= Number(currentTo) ? currentTo : null;
}

export function getNextYearFromForTo(
  currentFrom: string | null,
  nextTo: string | null,
) {
  if (!currentFrom || !nextTo) {
    return currentFrom;
  }

  return Number(currentFrom) <= Number(nextTo) ? currentFrom : null;
}

export function getNextYearTo(
  currentFrom: string | null,
  nextTo: string | null,
) {
  if (!currentFrom || !nextTo) {
    return nextTo;
  }

  return Number(currentFrom) <= Number(nextTo) ? nextTo : null;
}

function getServerTermFilter(
  selectedTerms: string[],
): Pick<ArticleListParams, "keywordId" | "topicId"> {
  if (selectedTerms.length !== 1) {
    return {};
  }

  const selectedTerm = parseArticleTermFilterValue(selectedTerms[0] ?? "");

  if (!selectedTerm) {
    return {};
  }

  return selectedTerm.kind === "keyword"
    ? { keywordId: selectedTerm.id }
    : { topicId: selectedTerm.id };
}

function getServerYearFilter(
  filters: ArticleFilters,
): Pick<
  ArticleListParams,
  "publicationYear" | "publicationYearFrom" | "publicationYearTo"
> {
  const years = [filters.yearFrom, filters.yearTo]
    .filter((year): year is string => Boolean(year?.trim()))
    .map((year) => Number(year))
    .filter((year) => Number.isInteger(year));

  if (years.length === 1) {
    return { publicationYear: years[0] };
  }

  if (years.length > 1) {
    return {
      publicationYearFrom: Math.min(...years),
      publicationYearTo: Math.max(...years),
    };
  }

  return {};
}

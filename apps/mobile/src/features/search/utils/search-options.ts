import type { ArticleGraph, AuthorListItem } from "@/types/academic.type";
import type { FilterOption } from "@/features/search/types/search.type";
import {
  createArticleTermFilterValue,
  uniqueFilterOptions,
  uniqueSorted,
} from "@/features/search/utils/search-filtering";

export function getArticleYearOptions({
  articles,
  yearFrom,
  yearTo,
}: {
  articles: ArticleGraph[];
  yearFrom: string | null;
  yearTo: string | null;
}) {
  return uniqueSorted(
    [
      ...getPublicationYearOptions(),
      ...articles.map((article) => article.article.publicationYear?.toString()),
      yearFrom,
      yearTo,
    ].filter((year): year is string => Boolean(year)),
  ).sort((left, right) => Number(right) - Number(left));
}

export function getArticleYearFromOptions({
  selectedYearTo,
  years,
}: {
  selectedYearTo: string | null;
  years: string[];
}) {
  return selectedYearTo
    ? years.filter((year) => Number(year) <= Number(selectedYearTo))
    : years;
}

export function getArticleYearToOptions({
  selectedYearFrom,
  years,
}: {
  selectedYearFrom: string | null;
  years: string[];
}) {
  return selectedYearFrom
    ? years.filter((year) => Number(year) >= Number(selectedYearFrom))
    : years;
}

export function getArticleKeywordOptions(articles: ArticleGraph[]) {
  return uniqueFilterOptions(
    articles
      .flatMap((article) => [
        ...article.keywords.map((item) =>
          createArticleTermOption("keyword", item.id, item.displayName),
        ),
        ...article.topics.map((item) =>
          createArticleTermOption("topic", item.id, item.displayName),
        ),
      ])
      .filter((option): option is FilterOption => Boolean(option)),
  );
}

export function filterAuthorsByKeyword(
  authors: AuthorListItem[],
  keyword: string,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return authors;
  }

  return authors.filter((author) => {
    const name = author.displayName?.toLowerCase() ?? "";
    const orcid = author.orcid?.toLowerCase() ?? "";

    return (
      name.includes(normalizedKeyword) || orcid.includes(normalizedKeyword)
    );
  });
}

function getPublicationYearOptions() {
  const firstYear = 2020;
  const currentYear = new Date().getFullYear();
  const yearCount = Math.max(currentYear - firstYear + 1, 1);

  return Array.from({ length: yearCount }, (_, index) =>
    (currentYear - index).toString(),
  );
}

function createArticleTermOption(
  kind: "keyword" | "topic",
  id: string,
  displayName: string | null,
): FilterOption | null {
  const label = displayName?.trim();

  if (!label) {
    return null;
  }

  return {
    label,
    value: createArticleTermFilterValue({ id, kind, label }),
  };
}

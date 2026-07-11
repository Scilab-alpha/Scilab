import {
  articleSearchFields,
  authorSearchFields,
} from "@/features/academic/constants/search-filters";
import type {
  ArticleGraph,
  AuthorListItem,
  KeywordNode,
  TopicNode,
} from "@/features/academic/types/article.type";
import type {
  ArticleFilters,
  ArticleSearchField,
  AuthorFilters,
  AuthorSearchField,
  PickerConfig,
} from "@/features/academic/types/search.type";
import {
  getArticleJournal,
  getArticleTitle,
} from "@/features/academic/utils/article-format";

export function filterArticles(
  articles: ArticleGraph[],
  keyword: string,
  filters: ArticleFilters,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();

  return articles.filter((article) => {
    if (
      filters.years.length > 0 &&
      !filters.years.includes(article.article.publicationYear?.toString() ?? "")
    ) {
      return false;
    }

    if (
      filters.keywords.length > 0 &&
      !articleHasSelectedKeyword(article, filters.keywords)
    ) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return articleMatchesFields(article, normalizedKeyword, filters.fields);
  });
}

export function filterAuthors(
  authors: AuthorListItem[],
  keyword: string,
  filters: AuthorFilters,
) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const minimumArticles =
    filters.minimumArticles === "all" ? 0 : Number(filters.minimumArticles);
  const filtered = authors.filter((author) => {
    if (!authorMatchesFields(author, normalizedKeyword, filters.fields)) {
      return false;
    }

    return author.articleCount >= minimumArticles;
  });

  if (filters.sort === "articles") {
    return filtered.sort(
      (left, right) => right.articleCount - left.articleCount,
    );
  }

  if (filters.sort === "name") {
    return filtered.sort((left, right) =>
      (left.displayName ?? "").localeCompare(right.displayName ?? ""),
    );
  }

  return filtered;
}

export function formatMinimumArticles(value: AuthorFilters["minimumArticles"]) {
  if (value === "10") {
    return "10+ articles";
  }

  if (value === "50") {
    return "50+ articles";
  }

  return "Publications";
}

export function formatAuthorSort(value: AuthorFilters["sort"]) {
  if (value === "name") {
    return "Name A-Z";
  }

  if (value === "articles") {
    return "Most articles";
  }

  return "Sort";
}

export function formatMultiValueLabel(label: string, values: string[]) {
  if (values.length === 0) {
    return label;
  }

  if (values.length === 1) {
    return values[0] ?? label;
  }

  return `${label} (${values.length})`;
}

export function formatPickerOption(value: string, mode: PickerConfig["mode"]) {
  if (mode === "author-publications") {
    return formatMinimumArticles(value as AuthorFilters["minimumArticles"]);
  }

  if (mode === "author-sort") {
    return formatAuthorSort(value as AuthorFilters["sort"]);
  }

  return value;
}

export function formatArticlePlaceholder(fields: ArticleSearchField[]) {
  if (fields.length === 1 && fields[0] === "title") {
    return "Search article title, abstract, or DOI...";
  }

  if (fields.length === 1 && fields[0] === "author") {
    return "Search articles by author...";
  }

  if (fields.length === 1 && fields[0] === "journal") {
    return "Search articles by journal...";
  }

  if (fields.length > 1) {
    return "Search within selected article fields...";
  }

  return "Search articles by title, author, or journal...";
}

export function formatAuthorPlaceholder(fields: AuthorSearchField[]) {
  if (fields.length === 1 && fields[0] === "name") {
    return "Search authors by name...";
  }

  if (fields.length === 1 && fields[0] === "orcid") {
    return "Search authors by ORCID...";
  }

  return "Search authors by name or ORCID...";
}

export function toggleValue<TValue extends string>(
  values: TValue[],
  value: TValue,
) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right),
  );
}

function articleMatchesFields(
  article: ArticleGraph,
  keyword: string,
  fields: ArticleSearchField[],
) {
  const titleFields = [
    getArticleTitle(article),
    article.article.abstract,
    article.article.doi,
  ];
  const authorFields = article.authors.map((author) => author.displayName);
  const journalFields = [
    getArticleJournal(article),
    article.journal?.publisherName,
    ...(article.journal?.issnList ?? []),
  ];
  const selectedFields =
    fields.length > 0
      ? fields
      : articleSearchFields.map((field) => field.value);

  return selectedFields.some((field) => {
    if (field === "title") {
      return includesAny(titleFields, keyword);
    }

    if (field === "author") {
      return includesAny(authorFields, keyword);
    }

    return includesAny(journalFields, keyword);
  });
}

function articleHasSelectedKeyword(article: ArticleGraph, keywords: string[]) {
  const articleKeywords = getArticleTerms(article);

  return keywords.some((keyword) => articleKeywords.includes(keyword));
}

function authorMatchesFields(
  author: AuthorListItem,
  keyword: string,
  fields: AuthorSearchField[],
) {
  if (!keyword) {
    return true;
  }

  const name = author.displayName?.toLowerCase() ?? "";
  const orcid = author.orcid?.toLowerCase() ?? "";

  const selectedFields =
    fields.length > 0 ? fields : authorSearchFields.map((field) => field.value);

  return selectedFields.some((field) =>
    field === "name" ? name.includes(keyword) : orcid.includes(keyword),
  );
}

function getArticleTerms(article: {
  keywords: KeywordNode[];
  topics: TopicNode[];
}) {
  return [
    ...article.keywords.map((item) => item.displayName?.trim()),
    ...article.topics.map((item) => item.displayName?.trim()),
  ].filter((value): value is string => Boolean(value));
}

function includesAny(values: (string | null | undefined)[], keyword: string) {
  return values.some((value) => value?.toLowerCase().includes(keyword));
}

import type {
  ArticleGraph,
  AuthorNode,
  KeywordNode,
  TopicNode,
} from "@/features/experiments/types/article.types";

export function getArticleTitle(article: ArticleGraph) {
  return article.article.title || "Untitled article";
}

export function getArticleAuthors(article: ArticleGraph, maxCount = 3) {
  const names = article.authors
    .slice()
    .sort((left, right) => {
      const leftPosition = left.authorPosition ?? Number.MAX_SAFE_INTEGER;
      const rightPosition = right.authorPosition ?? Number.MAX_SAFE_INTEGER;

      return leftPosition - rightPosition;
    })
    .map((author) => author.displayName?.trim())
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) {
    return "Unknown authors";
  }

  if (names.length <= maxCount) {
    return names.join(", ");
  }

  return `${names.slice(0, maxCount).join(", ")} et al.`;
}

export function getArticleAuthorNames(article: ArticleGraph) {
  return article.authors
    .slice()
    .sort((left, right) => {
      const leftPosition = left.authorPosition ?? Number.MAX_SAFE_INTEGER;
      const rightPosition = right.authorPosition ?? Number.MAX_SAFE_INTEGER;

      return leftPosition - rightPosition;
    })
    .map((author) => author.displayName?.trim())
    .filter((name): name is string => Boolean(name));
}

export function getArticleJournal(article: ArticleGraph) {
  return article.journal?.displayName?.trim() || "No journal";
}

export function getArticleYear(article: ArticleGraph) {
  return article.article.publicationYear;
}

/** Inbound citation count from OpenAlex (`article.citationCount`). */
export function getArticleCitationCount(article: ArticleGraph) {
  return article.article.citationCount ?? 0;
}

/**
 * Related-work / graph neighbor count for Article Search filter + sort.
 *
 * Prefer `citedArticleIds` when outgoing references are hydrated.
 * Live list/detail currently often returns an empty array, so fall back to
 * OpenAlex `citationCount` as a connectivity proxy that actually varies.
 */
export function getArticleGraphNodeCount(article: ArticleGraph) {
  const relatedWorks = article.citedArticleIds?.length ?? 0;
  if (relatedWorks > 0) {
    return relatedWorks;
  }
  return article.article.citationCount ?? 0;
}

/** True when the count is still a citation proxy (refs not hydrated). */
export function isArticleGraphNodeCountProxy(article: ArticleGraph) {
  return (article.citedArticleIds?.length ?? 0) === 0;
}

export function getArticleDoi(article: ArticleGraph) {
  return article.article.doi?.trim() || "—";
}

export function getArticleAbstract(article: ArticleGraph) {
  return article.article.abstract?.trim() || "Abstract unavailable.";
}

export function getTagNames(items: (KeywordNode | TopicNode)[], maxCount = 4) {
  return items
    .map((item) => item.displayName?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, maxCount);
}

/** Primary OpenAlex topics for an article (isPrimary = true). */
export function getPrimaryTopics(article: ArticleGraph, maxCount = 3) {
  return article.topics
    .filter((topic) => topic.isPrimary)
    .map((topic) => topic.displayName?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, maxCount);
}

/** Non-primary related topics for an article. */
export function getRelatedTopics(article: ArticleGraph, maxCount = 4) {
  return article.topics
    .filter((topic) => !topic.isPrimary)
    .map((topic) => topic.displayName?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, maxCount);
}

export function getAuthorDisplayName(author: Pick<AuthorNode, "displayName">) {
  return author.displayName?.trim() || "Unknown author";
}

export function formatVolumeNumber(value: number | string | null) {
  if (value === null) {
    return "—";
  }

  return String(value);
}

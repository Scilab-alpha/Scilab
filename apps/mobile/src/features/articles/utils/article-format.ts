import type {
  ArticleGraph,
  AuthorNode,
  KeywordNode,
  TopicNode,
} from "@/types/academic.type";

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

  return `${names.slice(0, maxCount).join(", ")} +${names.length - maxCount}`;
}

export function getArticleJournal(article: ArticleGraph) {
  return article.journal?.displayName?.trim() || "No journal";
}

export function getArticleYear(article: ArticleGraph) {
  return article.article.publicationYear?.toString() ?? "No year";
}

export function getArticleAbstractPreview(article: ArticleGraph) {
  const abstract = article.article.abstract?.replace(/\s+/g, " ").trim();

  if (!abstract) {
    return "Abstract unavailable.";
  }

  return abstract.length > 180 ? `${abstract.slice(0, 180)}...` : abstract;
}

export function getTagNames(items: (KeywordNode | TopicNode)[], maxCount = 4) {
  return items
    .map((item) => item.displayName?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, maxCount);
}

export function getAuthorDisplayName(author: Pick<AuthorNode, "displayName">) {
  return author.displayName?.trim() || "Unknown author";
}

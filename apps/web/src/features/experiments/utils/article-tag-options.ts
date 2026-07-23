import type { ArticleGraph } from "@/features/experiments/types/article.types";

export type ArticleTagOption = {
  id: string;
  name: string;
};

/** Collect unique keyword/topic options (deduped by display name). */
export function collectArticleTagOptions(
  articles: ArticleGraph[],
  kind: "keywords" | "topics",
): ArticleTagOption[] {
  const map = new Map<string, ArticleTagOption>();

  for (const item of articles) {
    const tags = kind === "keywords" ? item.keywords : item.topics;
    for (const tag of tags) {
      const name = tag.displayName?.trim();
      if (!tag.id || !name) continue;
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { id: tag.id, name });
      }
    }
  }

  return [...map.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

/** Prefer the active filter tag so it stays visible on cards. */
export function pinTagName(names: string[], pinnedName?: string, maxCount = 4) {
  const cleaned = names
    .map((name) => name.trim())
    .filter(Boolean);
  if (!pinnedName?.trim()) {
    return cleaned.slice(0, maxCount);
  }

  const pinned = pinnedName.trim();
  const pinnedLower = pinned.toLowerCase();
  const rest = cleaned.filter((name) => name.toLowerCase() !== pinnedLower);
  const hasPinned = cleaned.some((name) => name.toLowerCase() === pinnedLower);
  return (hasPinned ? [pinned, ...rest] : cleaned).slice(0, maxCount);
}

import type { ArticleFilters } from "@/features/search/types/search.type";

export const defaultArticleFilters: ArticleFilters = {
  keywords: [],
  sort: "relevant",
  yearFrom: null,
  yearTo: null,
};

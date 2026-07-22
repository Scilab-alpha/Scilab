import Ionicons from "@expo/vector-icons/Ionicons";

import type {
  ArticleFilters,
  ArticleSearchField,
  AuthorFilters,
  AuthorSearchField,
} from "@/features/search/types/search.type";

type FilterField<TValue extends string> = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: TValue;
};

export const defaultArticleFilters: ArticleFilters = {
  fields: [],
  keywords: [],
  years: [],
};

export const defaultAuthorFilters: AuthorFilters = {
  fields: [],
  minimumArticles: "all",
  sort: "relevance",
};

export const articleSearchFields: FilterField<ArticleSearchField>[] = [
  { icon: "document-text-outline", label: "Title", value: "title" },
  { icon: "person-outline", label: "Author", value: "author" },
  { icon: "book-outline", label: "Journal", value: "journal" },
];

export const authorSearchFields: FilterField<AuthorSearchField>[] = [
  { icon: "person-outline", label: "Name", value: "name" },
  { icon: "finger-print-outline", label: "ORCID", value: "orcid" },
];

export type ArticleSearchField = "title" | "author" | "journal";

export type AuthorSearchField = "name" | "orcid";

export type FilterOption = {
  label: string;
  value: string;
};

export type PickerConfig =
  | {
      mode: "article-keywords";
      options: FilterOption[];
      selectedValues: string[];
      title: string;
    }
  | {
      mode: "article-years";
      options: FilterOption[];
      selectedValues: string[];
      title: string;
    }
  | {
      mode: "author-publications";
      options: FilterOption[];
      selectedValues: string[];
      title: string;
    }
  | {
      mode: "author-sort";
      options: FilterOption[];
      selectedValues: string[];
      title: string;
    };

export type ArticleFilters = {
  fields: ArticleSearchField[];
  keywords: string[];
  years: string[];
};

export type AuthorFilters = {
  fields: AuthorSearchField[];
  minimumArticles: "all" | "10" | "50";
  sort: "relevance" | "name" | "articles";
};

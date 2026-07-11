export type ArticleSearchField = "title" | "author" | "journal";

export type AuthorSearchField = "name" | "orcid";

export type PickerConfig =
  | {
      mode: "article-keywords";
      options: string[];
      selectedValues: string[];
      title: string;
    }
  | {
      mode: "article-years";
      options: string[];
      selectedValues: string[];
      title: string;
    }
  | {
      mode: "author-publications";
      options: string[];
      selectedValues: string[];
      title: string;
    }
  | {
      mode: "author-sort";
      options: string[];
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

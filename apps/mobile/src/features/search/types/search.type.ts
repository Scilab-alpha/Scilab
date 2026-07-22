export type ArticleSort = "relevant" | "newest" | "most_cited";

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
      minYear?: number;
      maxYear?: number;
      mode: "article-year-from";
      options: FilterOption[];
      selectedValues: string[];
      supportsCustomYear: true;
      title: string;
    }
  | {
      maxYear?: number;
      minYear?: number;
      mode: "article-year-to";
      options: FilterOption[];
      selectedValues: string[];
      supportsCustomYear: true;
      title: string;
    }
  | {
      mode: "article-sort";
      options: FilterOption[];
      selectedValues: string[];
      title: string;
    };

export type ArticleFilters = {
  keywords: string[];
  sort: ArticleSort;
  yearFrom: string | null;
  yearTo: string | null;
};

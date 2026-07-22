import { defaultArticleFilters } from "@/features/search/constants/search-filters";
import {
  FilterChip,
  FilterRow,
} from "@/features/search/components/filter-chip";
import type { SearchMode } from "@/features/search/components/search-mode-tabs";
import type {
  ArticleFilters,
  FilterOption,
  PickerConfig,
} from "@/features/search/types/search.type";
import {
  formatArticleSort,
  formatArticleTermFilterValue,
  formatMultiValueLabel,
  toFilterOptions,
} from "@/features/search/utils/search-filtering";

export function SearchFilters({
  articleFilters,
  articleKeywords,
  articleYearFromOptions,
  articleYearToOptions,
  mode,
  onArticleFiltersChange,
  onOpenPicker,
}: {
  articleFilters: ArticleFilters;
  articleKeywords: FilterOption[];
  articleYearFromOptions: string[];
  articleYearToOptions: string[];
  mode: SearchMode;
  onArticleFiltersChange: (filters: ArticleFilters) => void;
  onOpenPicker: (picker: PickerConfig) => void;
}) {
  const hasArticleFilter = Boolean(
    articleFilters.keywords.length > 0 ||
    articleFilters.yearFrom ||
    articleFilters.yearTo ||
    articleFilters.sort !== defaultArticleFilters.sort,
  );

  if (mode === "authors") {
    return null;
  }

  return (
    <FilterRow>
      <FilterChip
        icon="pricetag-outline"
        label={formatMultiValueLabel(
          "Keywords",
          articleFilters.keywords.map(formatArticleTermFilterValue),
        )}
        onPress={() =>
          onOpenPicker({
            mode: "article-keywords",
            options: articleKeywords,
            selectedValues: articleFilters.keywords,
            title: "Keywords and topics",
          })
        }
        selected={articleFilters.keywords.length > 0}
      />
      <FilterChip
        icon="calendar-outline"
        label={
          articleFilters.yearFrom ? `From ${articleFilters.yearFrom}` : "From"
        }
        onPress={() =>
          onOpenPicker({
            maxYear: articleFilters.yearTo
              ? Number(articleFilters.yearTo)
              : undefined,
            mode: "article-year-from",
            options: toFilterOptions(articleYearFromOptions),
            selectedValues: articleFilters.yearFrom
              ? [articleFilters.yearFrom]
              : [],
            supportsCustomYear: true,
            title: "From year",
          })
        }
        selected={Boolean(articleFilters.yearFrom)}
      />
      <FilterChip
        icon="calendar-outline"
        label={articleFilters.yearTo ? `To ${articleFilters.yearTo}` : "To"}
        onPress={() =>
          onOpenPicker({
            minYear: articleFilters.yearFrom
              ? Number(articleFilters.yearFrom)
              : undefined,
            mode: "article-year-to",
            options: toFilterOptions(articleYearToOptions),
            selectedValues: articleFilters.yearTo
              ? [articleFilters.yearTo]
              : [],
            supportsCustomYear: true,
            title: "To year",
          })
        }
        selected={Boolean(articleFilters.yearTo)}
      />
      <FilterChip
        icon="swap-vertical-outline"
        label={formatArticleSort(articleFilters.sort)}
        onPress={() =>
          onOpenPicker({
            mode: "article-sort",
            options: toFilterOptions(["relevant", "newest", "most_cited"]),
            selectedValues: [articleFilters.sort],
            title: "Sort articles",
          })
        }
        selected={articleFilters.sort !== defaultArticleFilters.sort}
      />
      {hasArticleFilter ? (
        <FilterChip
          icon="close"
          label="Clear"
          onPress={() => onArticleFiltersChange(defaultArticleFilters)}
        />
      ) : null}
    </FilterRow>
  );
}

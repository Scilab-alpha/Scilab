import type {
  ArticleFilters,
  FilterOption,
} from "@/features/search/types/search.type";

type ArticleTermFilter = {
  id: string;
  kind: "keyword" | "topic";
  label: string;
};

export function formatArticleSort(value: ArticleFilters["sort"]) {
  if (value === "newest") {
    return "Newest";
  }

  if (value === "most_cited") {
    return "Most cited";
  }

  return "Best match";
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

export function formatArticlePlaceholder() {
  return "Search articles by title, abstract, keywords, or topics...";
}

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function toFilterOptions(values: string[]): FilterOption[] {
  return values.map((value) => ({
    label: formatPickerOptionLabel(value),
    value,
  }));
}

export function uniqueFilterOptions(options: FilterOption[]) {
  const optionsByValue = new Map<string, FilterOption>();

  for (const option of options) {
    if (!optionsByValue.has(option.value)) {
      optionsByValue.set(option.value, option);
    }
  }

  return Array.from(optionsByValue.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

export function createArticleTermFilterValue({
  id,
  kind,
  label,
}: {
  id: string;
  kind: "keyword" | "topic";
  label: string;
}) {
  return [kind, encodeURIComponent(id), encodeURIComponent(label)].join("|");
}

export function parseArticleTermFilterValue(
  value: string,
): ArticleTermFilter | null {
  const [kind, encodedId, encodedLabel] = value.split("|");

  if ((kind !== "keyword" && kind !== "topic") || !encodedId || !encodedLabel) {
    return null;
  }

  try {
    return {
      id: decodeURIComponent(encodedId),
      kind,
      label: decodeURIComponent(encodedLabel),
    };
  } catch {
    return null;
  }
}

export function formatArticleTermFilterValue(value: string) {
  return parseArticleTermFilterValue(value)?.label ?? value;
}

function formatPickerOptionLabel(value: string) {
  if (value === "relevant" || value === "newest" || value === "most_cited") {
    return formatArticleSort(value as ArticleFilters["sort"]);
  }

  return value;
}

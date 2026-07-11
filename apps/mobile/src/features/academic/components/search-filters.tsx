import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  articleSearchFields,
  authorSearchFields,
  defaultArticleFilters,
  defaultAuthorFilters,
} from "@/features/academic/constants/search-filters";
import type { SearchMode } from "@/features/academic/components/search-mode-tabs";
import type {
  ArticleFilters,
  AuthorFilters,
  PickerConfig,
} from "@/features/academic/types/search.type";
import {
  formatAuthorSort,
  formatMinimumArticles,
  formatMultiValueLabel,
  formatPickerOption,
  toggleValue,
} from "@/features/academic/utils/search-filtering";
import { useAppTheme } from "@/theme";

export function SearchFilters({
  articleFilters,
  articleKeywords,
  articleYears,
  authorFilters,
  mode,
  onArticleFiltersChange,
  onAuthorFiltersChange,
  onOpenPicker,
}: {
  articleFilters: ArticleFilters;
  articleKeywords: string[];
  articleYears: string[];
  authorFilters: AuthorFilters;
  mode: SearchMode;
  onArticleFiltersChange: (filters: ArticleFilters) => void;
  onAuthorFiltersChange: (filters: AuthorFilters) => void;
  onOpenPicker: (picker: PickerConfig) => void;
}) {
  const hasArticleFilter = Boolean(
    articleFilters.fields.length > 0 ||
    articleFilters.keywords.length > 0 ||
    articleFilters.years.length > 0,
  );
  const hasAuthorFilter =
    authorFilters.fields.length > 0 ||
    authorFilters.minimumArticles !== "all" ||
    authorFilters.sort !== "relevance";

  if (mode === "authors") {
    return (
      <FilterRow>
        <FilterChip
          icon="apps-outline"
          label="All"
          onPress={() =>
            onAuthorFiltersChange({
              ...authorFilters,
              fields: [],
            })
          }
          selected={authorFilters.fields.length === 0}
        />
        {authorSearchFields.map((field) => (
          <FilterChip
            icon={field.icon}
            key={field.value}
            label={field.label}
            onPress={() =>
              onAuthorFiltersChange({
                ...authorFilters,
                fields: toggleValue(authorFilters.fields, field.value),
              })
            }
            selected={authorFilters.fields.includes(field.value)}
          />
        ))}
        <FilterChip
          icon="library-outline"
          label={formatMinimumArticles(authorFilters.minimumArticles)}
          onPress={() =>
            onOpenPicker({
              mode: "author-publications",
              options: ["all", "10", "50"],
              selectedValues: [authorFilters.minimumArticles],
              title: "Publication count",
            })
          }
          selected={authorFilters.minimumArticles !== "all"}
        />
        <FilterChip
          icon="swap-vertical-outline"
          label={formatAuthorSort(authorFilters.sort)}
          onPress={() =>
            onOpenPicker({
              mode: "author-sort",
              options: ["relevance", "name", "articles"],
              selectedValues: [authorFilters.sort],
              title: "Sort authors",
            })
          }
          selected={authorFilters.sort !== "relevance"}
        />
        {hasAuthorFilter ? (
          <FilterChip
            icon="close"
            label="Clear"
            onPress={() => onAuthorFiltersChange(defaultAuthorFilters)}
          />
        ) : null}
      </FilterRow>
    );
  }

  return (
    <FilterRow>
      <FilterChip
        icon="apps-outline"
        label="All"
        onPress={() =>
          onArticleFiltersChange({
            ...articleFilters,
            fields: [],
          })
        }
        selected={articleFilters.fields.length === 0}
      />
      {articleSearchFields.map((field) => (
        <FilterChip
          icon={field.icon}
          key={field.value}
          label={field.label}
          onPress={() =>
            onArticleFiltersChange({
              ...articleFilters,
              fields: toggleValue(articleFilters.fields, field.value),
            })
          }
          selected={articleFilters.fields.includes(field.value)}
        />
      ))}
      <FilterChip
        icon="pricetag-outline"
        label={formatMultiValueLabel("Keywords", articleFilters.keywords)}
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
        label={formatMultiValueLabel("Year", articleFilters.years)}
        onPress={() =>
          onOpenPicker({
            mode: "article-years",
            options: articleYears,
            selectedValues: articleFilters.years,
            title: "Publication year",
          })
        }
        selected={articleFilters.years.length > 0}
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

export function FilterDropdown({
  onChange,
  onClose,
  picker,
}: {
  onChange: (selectedValues: string[]) => void;
  onClose: () => void;
  picker: PickerConfig | null;
}) {
  const theme = useAppTheme();

  const isSingleSelect =
    picker?.mode === "author-publications" || picker?.mode === "author-sort";

  if (!picker) {
    return null;
  }

  return (
    <View
      style={[
        styles.dropdown,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <View style={styles.pickerHeader}>
        <Text
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          {picker.title}
        </Text>
        <Pressable
          accessibilityLabel="Close filter"
          hitSlop={8}
          onPress={onClose}
        >
          <Ionicons color={theme.colors.textMuted} name="close" size={18} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.pickerOptions}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={styles.pickerOptionsScroll}
      >
        {picker.options.length ? (
          picker.options.map((option) => {
            const value = String(option);
            const selected = picker.selectedValues.includes(value);

            return (
              <Pressable
                accessibilityRole={isSingleSelect ? "radio" : "checkbox"}
                accessibilityState={
                  isSingleSelect ? { selected } : { checked: selected }
                }
                key={value}
                onPress={() =>
                  onChange(
                    isSingleSelect
                      ? [value]
                      : toggleValue(picker.selectedValues, value),
                  )
                }
                style={({ pressed }) => [
                  styles.pickerOption,
                  {
                    backgroundColor: selected
                      ? theme.colors.primarySoft
                      : pressed
                        ? theme.colors.surfaceMuted
                        : theme.colors.surface,
                    borderColor: selected
                      ? theme.colors.primarySoft
                      : theme.colors.outlineSoft,
                    borderRadius: theme.radii.md,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    theme.typography.label,
                    {
                      color: selected
                        ? theme.colors.primary
                        : theme.colors.text,
                      flex: 1,
                    },
                  ]}
                >
                  {formatPickerOption(value, picker.mode)}
                </Text>
                {selected ? (
                  <Ionicons
                    color={theme.colors.primary}
                    name="checkmark"
                    size={17}
                  />
                ) : null}
              </Pressable>
            );
          })
        ) : (
          <Text
            selectable
            style={[theme.typography.body, { color: theme.colors.textMuted }]}
          >
            No options available yet.
          </Text>
        )}
      </ScrollView>

      <View style={styles.dropdownFooter}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange([])}
          style={({ pressed }) => [
            styles.dropdownAction,
            {
              backgroundColor: pressed
                ? theme.colors.surfaceMuted
                : theme.colors.surface,
              borderColor: theme.colors.outlineSoft,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          <Text
            style={[theme.typography.caption, { color: theme.colors.text }]}
          >
            Clear
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.dropdownAction,
            {
              backgroundColor: pressed
                ? theme.colors.primaryPressed
                : theme.colors.primary,
              borderColor: theme.colors.primary,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.onPrimary },
            ]}
          >
            Done
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FilterRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={styles.filterRow}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function FilterChip({
  icon,
  label,
  onPress,
  selected = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: selected
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: selected
            ? theme.colors.primarySoft
            : theme.colors.outlineSoft,
          borderRadius: theme.radii.pill,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Ionicons
        color={selected ? theme.colors.primary : theme.colors.textMuted}
        name={icon}
        size={12}
      />
      <Text
        numberOfLines={1}
        style={[
          theme.typography.caption,
          styles.filterLabel,
          { color: selected ? theme.colors.primary : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    borderCurve: "continuous",
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  dropdownAction: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 12,
  },
  dropdownFooter: {
    flexDirection: "row",
    gap: 10,
  },
  filterChip: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    maxWidth: 180,
    minHeight: 30,
    paddingHorizontal: 12,
  },
  filterLabel: {
    flexShrink: 1,
  },
  filterRow: {
    gap: 8,
  },
  pickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pickerOption: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  pickerOptions: {
    gap: 8,
  },
  pickerOptionsScroll: {
    maxHeight: 240,
  },
});

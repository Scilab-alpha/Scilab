import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";

import { ArticleResults } from "@/features/articles/components/article-results";
import { AuthorResults } from "@/features/authors/components/author-results";
import { FilterDropdown } from "@/features/search/components/filter-dropdown";
import {
  SearchModeTabs,
  type SearchMode,
} from "@/features/search/components/search-mode-tabs";
import { SearchBox } from "@/features/search/components/search-box";
import { SearchFilters } from "@/features/search/components/search-filters";
import { defaultArticleFilters } from "@/features/search/constants/search-filters";
import { useArticles } from "@/features/articles/hooks/use-articles";
import { useAuthors } from "@/features/authors/hooks/use-authors";
import { useDebouncedValue } from "@/features/search/hooks/use-debounced-value";
import type {
  ArticleFilters,
  PickerConfig,
} from "@/features/search/types/search.type";
import {
  filterAuthorsByKeyword,
  getArticleKeywordOptions,
  getArticleYearFromOptions,
  getArticleYearOptions,
  getArticleYearToOptions,
} from "@/features/search/utils/search-options";
import {
  getArticleQueryParams,
  getNextYearFrom,
  getNextYearFromForTo,
  getNextYearTo,
  getNextYearToForFrom,
} from "@/features/search/utils/search-query";
import { useAppTheme } from "@/theme";

export function SearchScreen() {
  const theme = useAppTheme();
  const [articleKeyword, setArticleKeyword] = useState("");
  const [authorKeyword, setAuthorKeyword] = useState("");
  const [mode, setMode] = useState<SearchMode>("articles");
  const [articleFilters, setArticleFilters] = useState<ArticleFilters>(
    defaultArticleFilters,
  );
  const [picker, setPicker] = useState<PickerConfig | null>(null);
  const [controlsHeight, setControlsHeight] = useState(0);
  const debouncedArticleKeyword = useDebouncedValue(articleKeyword);
  const debouncedAuthorKeyword = useDebouncedValue(authorKeyword);
  const controlsProgress = useRef(new Animated.Value(1)).current;
  const controlsVisible = useRef(true);
  const lastScrollY = useRef(0);
  const isShowingAuthors = mode === "authors";
  const articleQueryParams = useMemo(
    () => getArticleQueryParams(debouncedArticleKeyword, articleFilters),
    [debouncedArticleKeyword, articleFilters],
  );
  const articlesQuery = useArticles(articleQueryParams);
  const authorsQuery = useAuthors({ enabled: isShowingAuthors });
  const articles = useMemo(
    () => articlesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [articlesQuery.data],
  );
  const authors = useMemo(
    () => authorsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [authorsQuery.data],
  );
  const visibleAuthors = useMemo(
    () => filterAuthorsByKeyword(authors, debouncedAuthorKeyword),
    [authors, debouncedAuthorKeyword],
  );
  const articleYears = useMemo(
    () =>
      getArticleYearOptions({
        articles,
        yearFrom: articleFilters.yearFrom,
        yearTo: articleFilters.yearTo,
      }),
    [articles, articleFilters.yearFrom, articleFilters.yearTo],
  );
  const articleYearFromOptions = useMemo(
    () =>
      getArticleYearFromOptions({
        selectedYearTo: articleFilters.yearTo,
        years: articleYears,
      }),
    [articleYears, articleFilters.yearTo],
  );
  const articleYearToOptions = useMemo(
    () =>
      getArticleYearToOptions({
        selectedYearFrom: articleFilters.yearFrom,
        years: articleYears,
      }),
    [articleYears, articleFilters.yearFrom],
  );
  const articleKeywords = useMemo(
    () => getArticleKeywordOptions(articles),
    [articles],
  );
  const openPicker = (nextPicker: PickerConfig) => {
    setPicker((current) =>
      current?.mode === nextPicker.mode ? null : nextPicker,
    );
  };
  const updatePickerValues = (selectedValues: string[]) => {
    if (!picker) {
      return;
    }

    if (picker.mode === "article-keywords") {
      setArticleFilters((current) => ({
        ...current,
        keywords: selectedValues,
      }));
    }

    if (picker.mode === "article-year-from") {
      setArticleFilters((current) => ({
        ...current,
        yearFrom: getNextYearFrom(selectedValues[0] ?? null, current.yearTo),
        yearTo: getNextYearToForFrom(selectedValues[0] ?? null, current.yearTo),
      }));
    }

    if (picker.mode === "article-year-to") {
      setArticleFilters((current) => ({
        ...current,
        yearFrom: getNextYearFromForTo(
          current.yearFrom,
          selectedValues[0] ?? null,
        ),
        yearTo: getNextYearTo(current.yearFrom, selectedValues[0] ?? null),
      }));
    }

    if (picker.mode === "article-sort") {
      setArticleFilters((current) => ({
        ...current,
        sort: (selectedValues[0] as ArticleFilters["sort"]) ?? "relevant",
      }));
    }

    setPicker((current) =>
      current ? { ...current, selectedValues } : current,
    );
  };
  const setControlsVisible = useCallback(
    (isVisible: boolean) => {
      if (controlsVisible.current === isVisible) {
        return;
      }

      controlsVisible.current = isVisible;
      Animated.timing(controlsProgress, {
        duration: 180,
        toValue: isVisible ? 1 : 0,
        useNativeDriver: true,
      }).start();
    },
    [controlsProgress],
  );
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextY = Math.max(event.nativeEvent.contentOffset.y, 0);
      const deltaY = nextY - lastScrollY.current;

      if (Math.abs(deltaY) > 8) {
        if (deltaY > 0 && nextY > 48) {
          setControlsVisible(false);
        }

        if (deltaY < 0) {
          setControlsVisible(true);
        }
      }

      lastScrollY.current = nextY;
    },
    [setControlsVisible],
  );
  const controlsTranslateY = controlsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-(controlsHeight || 180), 0],
  });

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        onLayout={(event) => setControlsHeight(event.nativeEvent.layout.height)}
        style={[
          styles.controls,
          {
            backgroundColor: theme.colors.background,
            gap: theme.spacing.sm,
            opacity: controlsProgress,
            paddingBottom: theme.spacing.sm,
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.lg,
            transform: [{ translateY: controlsTranslateY }],
          },
        ]}
      >
        <SearchModeTabs mode={mode} onModeChange={setMode} />

        <SearchBox
          articleKeyword={articleKeyword}
          authorKeyword={authorKeyword}
          isShowingAuthors={isShowingAuthors}
          onArticleKeywordChange={setArticleKeyword}
          onAuthorKeywordChange={setAuthorKeyword}
        />

        <SearchFilters
          articleFilters={articleFilters}
          articleKeywords={articleKeywords}
          articleYearFromOptions={articleYearFromOptions}
          articleYearToOptions={articleYearToOptions}
          mode={mode}
          onArticleFiltersChange={setArticleFilters}
          onOpenPicker={openPicker}
        />

        <FilterDropdown
          onChange={updatePickerValues}
          onClose={() => setPicker(null)}
          picker={picker}
        />
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.spacing.xl,
            padding: theme.spacing.xl,
            paddingTop: (controlsHeight || 180) + theme.spacing.lg,
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: theme.colors.background }}
      >
        {isShowingAuthors ? (
          <AuthorResults
            authors={visibleAuthors}
            error={authorsQuery.error}
            hasNextPage={authorsQuery.hasNextPage}
            isError={authorsQuery.isError}
            isFetchingNextPage={authorsQuery.isFetchingNextPage}
            isLoading={authorsQuery.isLoading}
            keyword={debouncedAuthorKeyword}
            onLoadMore={() => void authorsQuery.fetchNextPage()}
            onRetry={() => void authorsQuery.refetch()}
          />
        ) : (
          <ArticleResults
            articles={articles}
            error={articlesQuery.error}
            hasNextPage={articlesQuery.hasNextPage}
            isError={articlesQuery.isError}
            isFetchingNextPage={articlesQuery.isFetchingNextPage}
            isLoading={articlesQuery.isLoading}
            keyword={debouncedArticleKeyword}
            onLoadMore={() => void articlesQuery.fetchNextPage()}
            onRetry={() => void articlesQuery.refetch()}
          />
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 112,
  },
  controls: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 2,
  },
  screen: {
    flex: 1,
  },
});

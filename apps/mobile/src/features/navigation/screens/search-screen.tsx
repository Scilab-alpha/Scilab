import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ArticleResults } from "@/features/academic/components/article-results";
import { AuthorResults } from "@/features/academic/components/author-results";
import {
  FilterDropdown,
  SearchFilters,
} from "@/features/academic/components/search-filters";
import {
  SearchModeTabs,
  type SearchMode,
} from "@/features/academic/components/search-mode-tabs";
import {
  defaultArticleFilters,
  defaultAuthorFilters,
} from "@/features/academic/constants/search-filters";
import { useArticles } from "@/features/academic/hooks/use-articles";
import { useAuthors } from "@/features/academic/hooks/use-authors";
import { useDebouncedValue } from "@/features/academic/hooks/use-debounced-value";
import type {
  ArticleFilters,
  AuthorFilters,
  PickerConfig,
} from "@/features/academic/types/search.type";
import {
  filterArticles,
  filterAuthors,
  formatArticlePlaceholder,
  formatAuthorPlaceholder,
  uniqueSorted,
} from "@/features/academic/utils/search-filtering";
import { useAppTheme } from "@/theme";

export function SearchScreen() {
  const theme = useAppTheme();
  const [keyword, setKeyword] = useState("");
  const [mode, setMode] = useState<SearchMode>("articles");
  const [articleFilters, setArticleFilters] = useState<ArticleFilters>(
    defaultArticleFilters,
  );
  const [authorFilters, setAuthorFilters] =
    useState<AuthorFilters>(defaultAuthorFilters);
  const [picker, setPicker] = useState<PickerConfig | null>(null);
  const [controlsHeight, setControlsHeight] = useState(0);
  const debouncedKeyword = useDebouncedValue(keyword);
  const controlsProgress = useRef(new Animated.Value(1)).current;
  const controlsVisible = useRef(true);
  const lastScrollY = useRef(0);
  const isShowingAuthors = mode === "authors";
  const articlesQuery = useArticles("");
  const authorsQuery = useAuthors({ enabled: isShowingAuthors });
  const articles = useMemo(
    () => articlesQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [articlesQuery.data],
  );
  const authors = useMemo(
    () => authorsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [authorsQuery.data],
  );
  const articleYears = useMemo(
    () =>
      uniqueSorted(
        articles
          .map((article) => article.article.publicationYear?.toString())
          .filter((year): year is string => Boolean(year)),
      ).sort((left, right) => Number(right) - Number(left)),
    [articles],
  );
  const articleKeywords = useMemo(
    () =>
      uniqueSorted(
        articles
          .flatMap((article) => [
            ...article.keywords.map((item) => item.displayName?.trim()),
            ...article.topics.map((item) => item.displayName?.trim()),
          ])
          .filter((name): name is string => Boolean(name)),
      ),
    [articles],
  );
  const visibleArticles = useMemo(
    () => filterArticles(articles, debouncedKeyword, articleFilters),
    [articles, debouncedKeyword, articleFilters],
  );
  const visibleAuthors = useMemo(
    () => filterAuthors(authors, debouncedKeyword, authorFilters),
    [authors, debouncedKeyword, authorFilters],
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

    if (picker.mode === "article-years") {
      setArticleFilters((current) => ({
        ...current,
        years: selectedValues,
      }));
    }

    if (picker.mode === "author-publications") {
      setAuthorFilters((current) => ({
        ...current,
        minimumArticles:
          (selectedValues[0] as AuthorFilters["minimumArticles"]) ?? "all",
      }));
    }

    if (picker.mode === "author-sort") {
      setAuthorFilters((current) => ({
        ...current,
        sort: (selectedValues[0] as AuthorFilters["sort"]) ?? "relevance",
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

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineSoft,
              borderRadius: theme.radii.pill,
            },
          ]}
        >
          <Ionicons color={theme.colors.textMuted} name="search" size={18} />
          <TextInput
            accessibilityLabel={
              isShowingAuthors ? "Search authors" : "Search articles"
            }
            onChangeText={setKeyword}
            placeholder={
              isShowingAuthors
                ? formatAuthorPlaceholder(authorFilters.fields)
                : formatArticlePlaceholder(articleFilters.fields)
            }
            placeholderTextColor={theme.colors.outline}
            style={[styles.input, { color: theme.colors.text }]}
            value={keyword}
          />
          {keyword ? (
            <Pressable
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => setKeyword("")}
            >
              <Ionicons
                color={theme.colors.textMuted}
                name="close-circle"
                size={20}
              />
            </Pressable>
          ) : null}
        </View>

        <SearchFilters
          articleFilters={articleFilters}
          articleKeywords={articleKeywords}
          articleYears={articleYears}
          authorFilters={authorFilters}
          mode={mode}
          onArticleFiltersChange={setArticleFilters}
          onAuthorFiltersChange={setAuthorFilters}
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
            keyword={debouncedKeyword}
            onLoadMore={() => void authorsQuery.fetchNextPage()}
            onRetry={() => void authorsQuery.refetch()}
          />
        ) : (
          <ArticleResults
            articles={visibleArticles}
            error={articlesQuery.error}
            hasNextPage={articlesQuery.hasNextPage}
            isError={articlesQuery.isError}
            isFetchingNextPage={articlesQuery.isFetchingNextPage}
            isLoading={articlesQuery.isLoading}
            keyword={debouncedKeyword}
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
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 10,
  },
  searchBox: {
    alignItems: "center",
    borderCurve: "continuous",
    borderWidth: 1,
    flexDirection: "row",
    gap: 9,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  screen: {
    flex: 1,
  },
});

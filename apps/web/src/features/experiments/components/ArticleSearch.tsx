"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  ChevronDown,
  Calendar,
  Quote,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  Network,
  Search,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import {
  ListPageMain,
  ListScrollArea,
} from "@/shared/components/layout/ListPageScroll";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import Can from "@/shared/components/auth/Can";
import { Label } from "@/shared/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useArticles } from "@/features/experiments/hooks/use-articles";
import { collectArticleTagOptions, pinTagName } from "@/features/experiments/utils/article-tag-options";
import {
  matchesArticleClientFilters,
  sortArticlesForClient,
} from "@/features/experiments/utils/article-client-filters";
import {
  CATALOG_INSIGHT_YEAR_FROM,
  CATALOG_INSIGHT_YEAR_TO,
} from "@/features/dashboard/api/fetch-catalog-sample";
import { useJournals } from "@/features/laboratories/hooks/use-journals";
import { toggleBookmark as toggleBookmarkApi } from "@/features/submissions/api/bookmarks.api";
import { bookmarksRootQueryKey } from "@/features/submissions/hooks/use-bookmarks";
import { isLocallyBookmarked } from "@/features/submissions/api/local-bookmarks";
import type {
  ArticleApiFilters,
  ArticleClientSort,
  ArticleGraph,
} from "@/features/experiments/types/article.types";
import {
  articleSortOptions,
  countryFilterOptions,
  graphNodeFilterOptions,
  toArticleApiSort,
  yearOptions,
} from "@/features/experiments/types/article.types";
import {
  getArticleAbstract,
  getArticleAuthorNames,
  getArticleCitationCount,
  getArticleDoi,
  getArticleGraphNodeCount,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
  getPrimaryTopics,
  getRelatedTopics,
  getTagNames,
} from "@/features/experiments/utils/article-format";
import {
  getJournalName,
  getJournalPublisher,
} from "@/features/laboratories/utils/journal-format";

const itemsPerPage = 10;
/** Stop auto-paging for graph-node filters after this many loaded articles. */
const graphFilterLoadCap = 120;

const filterFieldClassName =
  "w-full h-9 px-3 pr-8 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25";

const filterInputClassName =
  "h-9 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25";

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </Label>
      <div className="relative">
        <select
          id={id}
          className={filterFieldClassName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

export default function ArticleSearch() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkPendingIds, setBookmarkPendingIds] = useState<Set<string>>(
    new Set(),
  );

  const [sort, setSort] = useState<ArticleClientSort>("most_related");
  const [journalId, setJournalId] = useState("");
  const [publisher, setPublisher] = useState("");
  const [country, setCountry] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [yearFrom, setYearFrom] = useState("2023");
  const [yearTo, setYearTo] = useState("2025");

  const [doiSearch, setDoiSearch] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [keywordName, setKeywordName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [openAccess, setOpenAccess] = useState<"" | "oa" | "subscription">("");
  const [minGraphNodes, setMinGraphNodes] = useState("");

  const {
    items: journals,
    hasMore: hasMoreJournals,
    isLoadingMore: isLoadingMoreJournals,
    loadMore: loadMoreJournals,
  } = useJournals("");

  // Sort hits the API. Search + sidebar filters run client-side (API `q` is unreliable).
  // Keep a fixed 2023–2025 fetch window — unfiltered list calls are ~30s+.
  // `most_related` fetches newest (mixed counts) then client-sorts by strength.
  const apiFilters = useMemo<ArticleApiFilters>(
    () => ({
      sort: toArticleApiSort(sort),
      publicationYearFrom: String(CATALOG_INSIGHT_YEAR_FROM),
      publicationYearTo: String(CATALOG_INSIGHT_YEAR_TO),
    }),
    [sort],
  );

  const { items, isLoading, isLoadingMore, hasMore, error, reload, loadMore } =
    useArticles("", apiFilters);

  const journalOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const journal of journals) {
      map.set(journal.id, getJournalName(journal));
    }
    for (const article of items) {
      if (article.journal?.id) {
        const name =
          article.journal.displayName?.trim() || article.journal.id;
        if (!map.has(article.journal.id)) {
          map.set(article.journal.id, name);
        }
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [journals, items]);

  const publisherOptions = useMemo(() => {
    const values = new Set<string>();
    for (const journal of journals) {
      const name = getJournalPublisher(journal);
      if (name && name !== "—") {
        values.add(name);
      }
    }
    for (const article of items) {
      const name = article.journal?.publisherName?.trim();
      if (name) values.add(name);
    }
    return [...values].sort((left, right) => left.localeCompare(right));
  }, [journals, items]);

  // Derive facet options from search results — avoids an extra 100+100 catalog fetch.
  const keywordOptions = useMemo(
    () => collectArticleTagOptions(items, "keywords"),
    [items],
  );

  const topicOptions = useMemo(
    () => collectArticleTagOptions(items, "topics"),
    [items],
  );

  const filteredArticles = useMemo(() => {
    const matched = items.filter((article) =>
      matchesArticleClientFilters(article, {
        textSearch: searchQuery,
        doiSearch,
        authorSearch,
        openAccess,
        journalId,
        publisher,
        country,
        keywordName,
        topicName,
        selectedYear,
        yearFrom,
        yearTo,
        minGraphNodes,
      }),
    );
    return sortArticlesForClient(matched, sort);
  }, [
    items,
    searchQuery,
    doiSearch,
    authorSearch,
    openAccess,
    journalId,
    publisher,
    country,
    keywordName,
    topicName,
    selectedYear,
    yearFrom,
    yearTo,
    minGraphNodes,
    sort,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredArticles.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    sort,
    keywordName,
    topicName,
    journalId,
    publisher,
    country,
    selectedYear,
    yearFrom,
    yearTo,
    doiSearch,
    authorSearch,
    openAccess,
    minGraphNodes,
  ]);

  // When text search or a graph-node minimum is set, keep loading pages until we
  // have a usable match set (or hit the load cap / end of results).
  useEffect(() => {
    const min = Number(minGraphNodes);
    const hasGraphFloor = Number.isFinite(min) && min > 0;
    const hasTextSearch = searchQuery.trim().length > 0;
    if (!hasGraphFloor && !hasTextSearch) return;
    if (isLoading || isLoadingMore || !hasMore) return;
    if (items.length >= graphFilterLoadCap) return;
    if (filteredArticles.length >= itemsPerPage) return;
    void loadMore();
  }, [
    minGraphNodes,
    searchQuery,
    filteredArticles.length,
    items.length,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
  ]);

  useEffect(() => {
    setBookmarkedIds((previous) => {
      const next = new Set(previous);
      for (const graph of items) {
        if (isLocallyBookmarked(graph.article.id)) {
          next.add(graph.article.id);
        }
      }
      return next;
    });
  }, [items]);

  const toggleBookmark = async (graph: ArticleGraph) => {
    const articleId = graph.article.id;
    if (bookmarkPendingIds.has(articleId)) {
      return;
    }

    setBookmarkPendingIds((previous) => new Set(previous).add(articleId));

    try {
      const result = await toggleBookmarkApi({
        articleId,
        article: {
          id: articleId,
          title: getArticleTitle(graph),
          abstract: graph.article.abstract,
          doi: graph.article.doi,
          publicationYear: graph.article.publicationYear,
        },
      });
      setBookmarkedIds((previous) => {
        const next = new Set(previous);
        if (result.bookmarked) {
          next.add(articleId);
        } else {
          next.delete(articleId);
        }
        return next;
      });
      void queryClient.invalidateQueries({ queryKey: bookmarksRootQueryKey });
    } catch {
      // Keep previous bookmark state if the API call fails.
    } finally {
      setBookmarkPendingIds((previous) => {
        const next = new Set(previous);
        next.delete(articleId);
        return next;
      });
    }
  };

  const clearFilters = () => {
    setSort("most_related");
    setKeywordName("");
    setTopicName("");
    setJournalId("");
    setPublisher("");
    setCountry("");
    setSelectedYear("");
    setYearFrom("2023");
    setYearTo("2025");
    setDoiSearch("");
    setAuthorSearch("");
    setOpenAccess("");
    setMinGraphNodes("");
  };

  const activeFilterCount =
    (sort !== "most_related" ? 1 : 0) +
    (keywordName ? 1 : 0) +
    (topicName ? 1 : 0) +
    (journalId ? 1 : 0) +
    (publisher ? 1 : 0) +
    (country ? 1 : 0) +
    (selectedYear ? 1 : 0) +
    (yearFrom && yearFrom !== "2023" ? 1 : 0) +
    (yearTo && yearTo !== "2025" ? 1 : 0) +
    (doiSearch ? 1 : 0) +
    (authorSearch ? 1 : 0) +
    (openAccess ? 1 : 0) +
    (minGraphNodes ? 1 : 0);

  return (
    <>
      <StudentTopHeader
        searchPlaceholder="Search articles by title..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <ListPageMain>
        <PageContainer
          size="wide"
          className="flex-1 min-h-0 flex flex-col gap-4 py-6"
        >
          <div className="shrink-0 space-y-4">
            <div>
              <h1 className="font-heading text-3xl text-foreground">
                Article Search
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover research articles across all disciplines
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="article-name-search"
                className="text-sm font-medium"
              >
                Search by title, abstract, keyword, or topic
              </Label>
              <div className="relative max-w-2xl">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <Input
                  id="article-name-search"
                  type="search"
                  placeholder="Type a title, keyword, or topic…"
                  className="pl-10 h-11 bg-card"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex gap-8">
            {showFilters && (
              <aside className="w-72 flex-shrink-0 min-h-0">
                <Card className="p-5 border-border h-full min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-5 shrink-0">
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-muted-foreground" />
                      <h2 className="font-heading text-lg text-foreground">
                        Filters
                      </h2>
                      {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-3 text-xs text-muted-foreground"
                    >
                      Clear all
                    </Button>
                  </div>

                  <div className="space-y-5 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-1 py-1">
                    <p className="text-xs text-muted-foreground">
                      Search and filters apply instantly on loaded results. Sort
                      still calls the API.
                    </p>
                    <FilterSelect
                      id="sort-filter"
                      label="Sort"
                      value={sort}
                      onChange={(value) => setSort(value as ArticleClientSort)}
                    >
                      {articleSortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FilterSelect>

                    {sort === "most_related" && (
                      <p className="text-xs text-muted-foreground -mt-2">
                        Shows strongest connected articles first (related works
                        or citation count).
                      </p>
                    )}

                    {sort === "relevant" && (
                      <p className="text-xs text-muted-foreground -mt-2">
                        Relevant ranking needs a working API search; using
                        newest for the catalog fetch instead.
                      </p>
                    )}

                    <FilterSelect
                      id="graph-nodes-filter"
                      label="Graph nodes"
                      value={minGraphNodes}
                      onChange={setMinGraphNodes}
                    >
                      {graphNodeFilterOptions.map((option) => (
                        <option key={option.value || "any"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FilterSelect>
                    <p className="text-xs text-muted-foreground -mt-2">
                      Filters loaded results
                      {minGraphNodes
                        ? ` (≥${minGraphNodes}; may load more pages)`
                        : ""}
                      . Uses related works when synced, else citations.
                    </p>

                    <div className="pt-4 border-t border-border space-y-5">
                      <FilterSelect
                        id="journal-filter"
                        label="Journal"
                        value={journalId}
                        onChange={setJournalId}
                      >
                        <option value="">All journals</option>
                        {journalOptions.map((journal) => (
                          <option key={journal.id} value={journal.id}>
                            {journal.name}
                          </option>
                        ))}
                      </FilterSelect>

                      {hasMoreJournals && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-full text-xs"
                          disabled={isLoadingMoreJournals}
                          onClick={() => void loadMoreJournals()}
                        >
                          {isLoadingMoreJournals
                            ? "Loading journals…"
                            : "Load more journals"}
                        </Button>
                      )}

                      <FilterSelect
                        id="publisher-filter"
                        label="Publisher"
                        value={publisher}
                        onChange={setPublisher}
                      >
                        <option value="">All publishers</option>
                        {publisherOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </FilterSelect>

                      <FilterSelect
                        id="country-filter"
                        label="Country"
                        value={country}
                        onChange={setCountry}
                      >
                        <option value="">All countries</option>
                        {countryFilterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </FilterSelect>
                    </div>

                    <div className="pt-4 border-t border-border space-y-5">
                      <FilterSelect
                        id="year-filter"
                        label="Exact year"
                        value={selectedYear}
                        onChange={(value) => {
                          setSelectedYear(value);
                          if (value) {
                            setYearFrom("");
                            setYearTo("");
                          }
                        }}
                      >
                        <option value="">Any year</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </FilterSelect>

                      <FilterSelect
                        id="year-from-filter"
                        label="Year from"
                        value={yearFrom}
                        onChange={(value) => {
                          setYearFrom(value);
                          if (value) {
                            setSelectedYear("");
                          }
                        }}
                      >
                        <option value="">No lower bound</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </FilterSelect>

                      <FilterSelect
                        id="year-to-filter"
                        label="Year to"
                        value={yearTo}
                        onChange={(value) => {
                          setYearTo(value);
                          if (value) {
                            setSelectedYear("");
                          }
                        }}
                      >
                        <option value="">No upper bound</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </FilterSelect>

                      <FilterSelect
                        id="oa-filter"
                        label="Access"
                        value={openAccess}
                        onChange={(value) =>
                          setOpenAccess(value as "" | "oa" | "subscription")
                        }
                      >
                        <option value="">Any access</option>
                        <option value="oa">Open Access</option>
                        <option value="subscription">Subscription</option>
                      </FilterSelect>
                    </div>

                    <div className="pt-4 border-t border-border space-y-5">
                      <FilterSelect
                        id="keyword-filter"
                        label="Keyword"
                        value={keywordName}
                        onChange={setKeywordName}
                      >
                        <option value="">All keywords</option>
                        {keywordOptions.map((option) => (
                          <option key={option.name} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </FilterSelect>

                      <FilterSelect
                        id="topic-filter"
                        label="Topic"
                        value={topicName}
                        onChange={setTopicName}
                      >
                        <option value="">All topics</option>
                        {topicOptions.map((option) => (
                          <option key={option.name} value={option.name}>
                            {option.name}
                          </option>
                        ))}
                      </FilterSelect>
                    </div>

                    <div className="pt-4 border-t border-border space-y-5">
                      <div className="space-y-2">
                        <Label
                          htmlFor="doi-search"
                          className="text-sm font-semibold text-foreground"
                        >
                          DOI
                        </Label>
                        <Input
                          id="doi-search"
                          type="text"
                          placeholder="10.1038/..."
                          className={filterInputClassName}
                          value={doiSearch}
                          onChange={(event) => setDoiSearch(event.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="author-search"
                          className="text-sm font-semibold text-foreground"
                        >
                          Author
                        </Label>
                        <Input
                          id="author-search"
                          type="text"
                          placeholder="Author name"
                          className={filterInputClassName}
                          value={authorSearch}
                          onChange={(event) =>
                            setAuthorSearch(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </aside>
            )}

            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <div className="shrink-0 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? (
                    "Loading articles..."
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {filteredArticles.length === 0
                          ? 0
                          : `${startIndex + 1}-${Math.min(endIndex, filteredArticles.length)}`}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-foreground">
                        {filteredArticles.length}
                        {hasMore ||
                        ((minGraphNodes || searchQuery.trim()) &&
                          items.length < graphFilterLoadCap)
                          ? "+"
                          : ""}
                      </span>{" "}
                      articles
                      {minGraphNodes || searchQuery.trim() ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {items.length} loaded
                          {isLoadingMore ? " (loading more…)" : ""}
                        </span>
                      ) : null}
                    </>
                  )}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-9"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </div>

              {error && (
                <Card className="p-6 border-border shrink-0">
                  <p className="text-sm text-destructive mb-4">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void reload()}
                  >
                    Try again
                  </Button>
                </Card>
              )}

              {isLoading && <RouteDataLoading label="Loading articles…" />}

              {!isLoading && !error && currentArticles.length === 0 && (
                <Card className="p-8 border-border text-center text-muted-foreground">
                  No articles found. Try another keyword or clear your filters.
                </Card>
              )}

              <ListScrollArea className="pr-1">
                <div className="space-y-4 pb-2">
                  {currentArticles.map((article) => {
                    const articleId = article.article.id;
                    const keywords = pinTagName(
                      getTagNames(article.keywords, 12),
                      keywordName,
                      4,
                    );
                    const primaryTopics = pinTagName(
                      getPrimaryTopics(article, 8),
                      topicName,
                      3,
                    );
                    const relatedTopics = pinTagName(
                      getRelatedTopics(article, 8),
                      topicName &&
                        !primaryTopics.some(
                          (topic) =>
                            topic.toLowerCase() === topicName.toLowerCase(),
                        )
                        ? topicName
                        : undefined,
                      4,
                    );
                    const isBookmarked = bookmarkedIds.has(articleId);
                    const articleHref = `/student/articles/${encodeURIComponent(articleId)}`;

                    return (
                      <Card
                        key={articleId}
                        className="p-6 border-border hover:border-border transition-all"
                      >
                        <div className="flex gap-6">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-sans font-semibold text-2xl md:text-3xl text-foreground mb-3 line-clamp-2 leading-snug">
                              <button
                                type="button"
                                onClick={() => router.push(articleHref)}
                                className="text-left hover:text-primary transition-colors"
                              >
                                {getArticleTitle(article)}
                              </button>
                            </h3>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <span>
                                {getArticleAuthorNames(article).join(", ")}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1 min-w-0">
                                <BookOpen className="w-4 h-4 shrink-0" />
                                {article.journal?.id ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      router.push(
                                        `/student/journals/${encodeURIComponent(article.journal!.id)}`,
                                      );
                                    }}
                                    className="font-medium hover:underline text-left truncate"
                                  >
                                    {getArticleJournal(article)}
                                  </button>
                                ) : (
                                  <span className="font-medium truncate">
                                    {getArticleJournal(article)}
                                  </span>
                                )}
                              </div>
                              <span className="text-border">•</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{getArticleYear(article) ?? "—"}</span>
                              </div>
                              <span className="text-border">•</span>
                              <div className="flex items-center gap-1">
                                <Quote className="w-4 h-4" />
                                <span>
                                  {getArticleCitationCount(article)} citations
                                </span>
                              </div>
                              <span className="text-border">•</span>
                              <div className="flex items-center gap-1">
                                <Network className="w-4 h-4" />
                                <span>
                                  {getArticleGraphNodeCount(article)} graph
                                  nodes
                                  {(article.citedArticleIds?.length ?? 0) === 0
                                    ? " (via citations)"
                                    : ""}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                              {getArticleAbstract(article)}
                            </p>

                            {(primaryTopics.length > 0 ||
                              relatedTopics.length > 0 ||
                              keywords.length > 0) && (
                              <div className="space-y-3 mb-4">
                                {primaryTopics.length > 0 && (
                                  <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      Primary topic
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {primaryTopics.map((topic) => (
                                        <span
                                          key={`primary-${topic}`}
                                          className="px-2.5 py-1 bg-primary/15 text-foreground text-xs font-medium rounded-md border border-primary/25"
                                        >
                                          {topic}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {relatedTopics.length > 0 && (
                                  <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      Related topics
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {relatedTopics.map((topic) => (
                                        <span
                                          key={`related-${topic}`}
                                          className="px-2.5 py-1 bg-accent text-tag text-xs font-medium rounded-md"
                                        >
                                          {topic}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {keywords.length > 0 && (
                                  <div className="space-y-1.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                      Keywords
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {keywords.map((keyword) => (
                                        <span
                                          key={`keyword-${keyword}`}
                                          className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md"
                                        >
                                          {keyword}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                              DOI: {getArticleDoi(article)}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 px-4"
                              onClick={() => router.push(articleHref)}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Can permission="bookmark">
                              <Button
                                variant={isBookmarked ? "default" : "outline"}
                                size="sm"
                                disabled={bookmarkPendingIds.has(articleId)}
                                onClick={() => void toggleBookmark(article)}
                                className="h-9 px-4"
                              >
                                {isBookmarked ? (
                                  <>
                                    <BookmarkCheck className="w-4 h-4 mr-2" />
                                    Saved
                                  </>
                                ) : (
                                  <>
                                    <BookmarkPlus className="w-4 h-4 mr-2" />
                                    Save
                                  </>
                                )}
                              </Button>
                            </Can>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </ListScrollArea>

              {!isLoading && filteredArticles.length > 0 && (
                <div className="shrink-0 flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from(
                      { length: Math.min(totalPages, 5) },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-primary text-white"
                            : "bg-card border border-border text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      isLoadingMore || (currentPage === totalPages && !hasMore)
                    }
                    onClick={() => {
                      if (currentPage < totalPages) {
                        setCurrentPage((prev) => prev + 1);
                        return;
                      }

                      void loadMore().then((loaded) => {
                        if (loaded) {
                          setCurrentPage((prev) => prev + 1);
                        }
                      });
                    }}
                    className="h-9"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Loading
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </ListPageMain>
    </>
  );
}

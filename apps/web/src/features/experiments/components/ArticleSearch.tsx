"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  Calendar,
  Quote,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import Can from "@/shared/components/auth/Can";
import { Label } from "@/shared/components/ui/label";
import { useArticles } from "@/features/experiments/hooks/use-articles";
import { useBookmarks } from "@/features/submissions/hooks/use-bookmarks";
import type {
  ArticleGraph,
  ArticleListParams,
} from "@/features/experiments/types/article.types";
import {
  getArticleAbstract,
  getArticleAuthorNames,
  getArticleDoi,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
  getTagNames,
} from "@/features/experiments/utils/article-format";

const itemsPerPage = 10;

export default function ArticleSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [publisher, setPublisher] = useState("");
  const [country, setCountry] = useState("");
  const [sort, setSort] = useState<ArticleListParams["sort"]>();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkPendingIds, setBookmarkPendingIds] = useState<Set<string>>(
    new Set(),
  );
  const effectiveSort =
    sort === "relevant" && !searchQuery.trim() ? undefined : sort;

  const articleParams = useMemo<ArticleListParams>(() => {
    const parsedYear = Number(selectedYear);
    return {
      q: searchQuery,
      publicationYear:
        Number.isInteger(parsedYear) && parsedYear >= 1000
          ? parsedYear
          : undefined,
      publisher: publisher || undefined,
      country: country || undefined,
      sort: effectiveSort,
    };
  }, [country, effectiveSort, publisher, searchQuery, selectedYear]);
  const { items, isLoading, isLoadingMore, hasMore, error, reload, loadMore } =
    useArticles(articleParams);
  const bookmarks = useBookmarks();
  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.items.map((item) => item.articleId)),
    [bookmarks.items],
  );

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = items.slice(startIndex, endIndex);

  const toggleBookmark = async (graph: ArticleGraph) => {
    const articleId = graph.article.id;
    if (bookmarkPendingIds.has(articleId)) {
      return;
    }

    setBookmarkPendingIds((previous) => new Set(previous).add(articleId));

    try {
      await bookmarks.toggle({
        articleId,
        article: {
          id: articleId,
          title: getArticleTitle(graph),
          abstract: graph.article.abstract,
          doi: graph.article.doi,
          publicationYear: graph.article.publicationYear,
        },
      });
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
    setSelectedYear("");
    setPublisher("");
    setCountry("");
    setSort(undefined);
    setCurrentPage(1);
  };

  const activeFilterCount =
    (selectedYear ? 1 : 0) +
    (publisher ? 1 : 0) +
    (country ? 1 : 0) +
    (effectiveSort ? 1 : 0);

  return (
    <>
      <StudentTopHeader
        searchPlaceholder="Search articles by title..."
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
      />

      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-heading text-3xl text-foreground">
                Article Search
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover research articles across all disciplines
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-10"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? "Hide Filters" : "Advanced Filters"}
              {activeFilterCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="article-name-search"
              className="text-sm font-medium"
            >
              Search by article title
            </Label>
            <div className="relative max-w-2xl">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                id="article-name-search"
                type="search"
                placeholder="Type an article name…"
                className="pl-10 h-11 bg-card"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {showFilters && (
            <Card className="p-6 border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg text-foreground">
                  Advanced Filters
                </h2>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year-filter" className="text-sm font-medium">
                    Publication year
                  </Label>
                  <Input
                    id="year-filter"
                    type="number"
                    min={1000}
                    placeholder="2026"
                    className="h-9"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publisher" className="text-sm font-medium">
                    Publisher
                  </Label>
                  <Input
                    id="publisher"
                    type="text"
                    placeholder="Exact publisher name"
                    className="h-9"
                    value={publisher}
                    onChange={(e) => {
                      setPublisher(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country code
                  </Label>
                  <Input
                    id="country"
                    type="text"
                    maxLength={2}
                    placeholder="US"
                    className="h-9"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value.toUpperCase());
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort" className="text-sm font-medium">
                    Sort
                  </Label>
                  <select
                    id="sort"
                    className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={effectiveSort ?? ""}
                    onChange={(event) => {
                      setSort(
                        (event.target.value ||
                          undefined) as ArticleListParams["sort"],
                      );
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">Backend default</option>
                    <option value="relevant" disabled={!searchQuery.trim()}>
                      Relevant
                    </option>
                    <option value="newest">Newest</option>
                    <option value="most_cited">Most cited</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Loading articles..."
              ) : (
                <>
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {items.length === 0
                      ? 0
                      : `${startIndex + 1}-${Math.min(endIndex, items.length)}`}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {items.length}
                    {hasMore ? "+" : ""}
                  </span>{" "}
                  articles
                </>
              )}
            </p>
          </div>

          {error && (
            <Card className="p-6 border-border">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
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

          <div className="space-y-4">
            {currentArticles.map((article) => {
              const articleId = article.article.id;
              const keywords = getTagNames(article.keywords);
              const isBookmarked = bookmarkedIds.has(articleId);

              return (
                <Card
                  key={articleId}
                  className="p-6 border-border hover:border-border transition-all"
                >
                  <div className="flex gap-6">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading text-xl text-foreground mb-3 hover:text-primary transition-colors cursor-pointer line-clamp-2">
                        {getArticleTitle(article)}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span>{getArticleAuthorNames(article).join(", ")}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span className="font-medium">
                            {getArticleJournal(article)}
                          </span>
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
                            {article.article.citationCount ?? "—"} citations
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                        {getArticleAbstract(article)}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="px-2.5 py-1 bg-accent text-tag text-xs font-medium rounded-md"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        DOI: {getArticleDoi(article)}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4"
                        onClick={() =>
                          router.push(`/student/articles/${articleId}`)
                        }
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Can permission="bookmark">
                        <Button
                          variant={isBookmarked ? "default" : "outline"}
                          size="sm"
                          disabled={
                            bookmarks.isLoading ||
                            Boolean(bookmarks.error) ||
                            bookmarkPendingIds.has(articleId)
                          }
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

          {!isLoading && items.length > 0 && (
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
        </PageContainer>
      </main>
    </>
  );
}

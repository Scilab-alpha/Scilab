"use client";

import { useEffect, useMemo, useState } from "react";
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
import { toggleBookmark as toggleBookmarkApi } from "@/features/submissions/api/bookmarks.api";
import { isLocallyBookmarked } from "@/features/submissions/api/local-bookmarks";
import type { ArticleGraph } from "@/features/experiments/types/article.types";
import {
  getArticleAbstract,
  getArticleAuthorNames,
  getArticleDoi,
  getArticleJournal,
  getArticleTitle,
  getArticleYear,
  getTagNames,
} from "@/features/experiments/utils/article-format";
import { yearOptions } from "@/features/experiments/types/article.types";

const itemsPerPage = 10;

function matchesAdvancedFilters(
  article: ArticleGraph,
  filters: {
    doiSearch: string;
    authorSearch: string;
    journalSearch: string;
    selectedYear: string;
  },
) {
  const doi = article.article.doi ?? "";
  const authors = getArticleAuthorNames(article).join(" ").toLowerCase();
  const journal = getArticleJournal(article).toLowerCase();
  const year = article.article.publicationYear?.toString() ?? "";

  if (
    filters.doiSearch &&
    !doi.toLowerCase().includes(filters.doiSearch.toLowerCase())
  ) {
    return false;
  }

  if (
    filters.authorSearch &&
    !authors.includes(filters.authorSearch.toLowerCase())
  ) {
    return false;
  }

  if (
    filters.journalSearch &&
    !journal.includes(filters.journalSearch.toLowerCase())
  ) {
    return false;
  }

  if (filters.selectedYear && year !== filters.selectedYear) {
    return false;
  }

  return true;
}

export default function ArticleSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [doiSearch, setDoiSearch] = useState("");
  const [authorSearch, setAuthorSearch] = useState("");
  const [journalSearch, setJournalSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkPendingIds, setBookmarkPendingIds] = useState<Set<string>>(
    new Set(),
  );

  const { items, isLoading, isLoadingMore, hasMore, error, reload, loadMore } =
    useArticles(searchQuery);

  const filteredArticles = useMemo(() => {
    const titleQuery = searchQuery.trim().toLowerCase();
    return items.filter((article) => {
      if (
        titleQuery &&
        !getArticleTitle(article).toLowerCase().includes(titleQuery)
      ) {
        return false;
      }
      return matchesAdvancedFilters(article, {
        doiSearch,
        authorSearch,
        journalSearch,
        selectedYear,
      });
    });
  }, [
    items,
    searchQuery,
    doiSearch,
    authorSearch,
    journalSearch,
    selectedYear,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredArticles.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

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
    setDoiSearch("");
    setAuthorSearch("");
    setJournalSearch("");
    setSelectedYear("");
    setCurrentPage(1);
  };

  const activeFilterCount =
    (doiSearch ? 1 : 0) +
    (authorSearch ? 1 : 0) +
    (journalSearch ? 1 : 0) +
    (selectedYear ? 1 : 0);

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
                  <Label htmlFor="doi-search" className="text-sm font-medium">
                    DOI
                  </Label>
                  <Input
                    id="doi-search"
                    type="text"
                    placeholder="10.1038/..."
                    className="h-9"
                    value={doiSearch}
                    onChange={(e) => {
                      setDoiSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="author-search"
                    className="text-sm font-medium"
                  >
                    Author
                  </Label>
                  <Input
                    id="author-search"
                    type="text"
                    placeholder="Author name"
                    className="h-9"
                    value={authorSearch}
                    onChange={(e) => {
                      setAuthorSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="journal-search"
                    className="text-sm font-medium"
                  >
                    Journal
                  </Label>
                  <Input
                    id="journal-search"
                    type="text"
                    placeholder="Journal name"
                    className="h-9"
                    value={journalSearch}
                    onChange={(e) => {
                      setJournalSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year-filter" className="text-sm font-medium">
                    Year
                  </Label>
                  <div className="relative">
                    <select
                      id="year-filter"
                      className="w-full h-9 px-3 pr-8 bg-card border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All years</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
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
                    {filteredArticles.length === 0
                      ? 0
                      : `${startIndex + 1}-${Math.min(endIndex, filteredArticles.length)}`}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {filteredArticles.length}
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
                            {article.citedArticleIds.length} citations
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

          {!isLoading && filteredArticles.length > 0 && (
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

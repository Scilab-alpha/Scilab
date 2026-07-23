"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  ChevronDown,
  Globe,
  BookOpen,
  Award,
  Lock,
  LockOpen,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { useJournals } from "@/features/laboratories/hooks/use-journals";
import type { JournalListItem } from "@/features/experiments/types/journal.types";
import {
  getJournalCountry,
  getJournalIssn,
  getJournalName,
  getJournalPublisher,
  getJournalSubjects,
} from "@/features/laboratories/utils/journal-format";

const FACET_OPTION_LIMIT = 24;

type JournalFilters = {
  subjectAreas: string[];
  countries: string[];
  publishers: string[];
  openAccess: boolean;
  oaDiamond: boolean;
};

function normalizeFacet(value: string) {
  return value.trim().toLowerCase();
}

function collectFacetOptions(
  values: Iterable<string>,
  limit = FACET_OPTION_LIMIT,
) {
  const counts = new Map<string, { label: string; count: number }>();

  for (const raw of values) {
    const label = raw.trim();
    if (!label || label === "—") {
      continue;
    }

    const key = normalizeFacet(label);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { label, count: 1 });
    }
  }

  return [...counts.values()]
    .sort(
      (a, b) =>
        b.count - a.count || a.label.localeCompare(b.label, undefined, {
          sensitivity: "base",
        }),
    )
    .slice(0, limit)
    .map((entry) => entry.label);
}

function journalPartialScore(journal: JournalListItem, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return 0;
  }

  const name = getJournalName(journal).toLowerCase();
  const issn = getJournalIssn(journal).toLowerCase();
  const publisher = getJournalPublisher(journal).toLowerCase();
  const country = getJournalCountry(journal).toLowerCase();
  const subjects = getJournalSubjects(journal)
    .join(" ")
    .toLowerCase();
  const haystack = [name, issn, publisher, country, subjects].join(" ");

  if (name === normalized) return 100;
  if (name.startsWith(normalized)) return 80;
  if (name.includes(normalized)) return 60;
  if (subjects.includes(normalized)) return 40;
  if (publisher.includes(normalized) || issn.includes(normalized)) return 30;
  if (haystack.includes(normalized)) return 10;
  // Token partial: every query token appears somewhere.
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => haystack.includes(token))) {
    return 20;
  }
  return -1;
}

function matchesJournalFilters(
  journal: JournalListItem,
  searchQuery: string,
  filters: JournalFilters,
) {
  if (journalPartialScore(journal, searchQuery) < 0) {
    return false;
  }

  if (filters.subjectAreas.length > 0) {
    const subjects = getJournalSubjects(journal).map(normalizeFacet);
    const selected = filters.subjectAreas.map(normalizeFacet);
    if (!selected.some((subject) => subjects.includes(subject))) {
      return false;
    }
  }

  if (filters.countries.length > 0) {
    const country = normalizeFacet(getJournalCountry(journal));
    if (
      !country ||
      country === "—" ||
      !filters.countries.some((value) => normalizeFacet(value) === country)
    ) {
      return false;
    }
  }

  if (filters.publishers.length > 0) {
    const publisher = normalizeFacet(getJournalPublisher(journal));
    if (
      !publisher ||
      publisher === "—" ||
      !filters.publishers.some((value) => normalizeFacet(value) === publisher)
    ) {
      return false;
    }
  }

  if (filters.openAccess && !journal.isOpenAccess) {
    return false;
  }

  if (filters.oaDiamond && !journal.isOaDiamond) {
    return false;
  }

  return true;
}

export default function JournalSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy] = useState("relevance");
  const { items, isLoading, isLoadingMore, hasMore, error, reload, loadMore } =
    useJournals(searchQuery);

  const [filters, setFilters] = useState<JournalFilters>({
    subjectAreas: [],
    countries: [],
    publishers: [],
    openAccess: false,
    oaDiamond: false,
  });

  const itemsPerPage = 8;

  const subjectAreaOptions = useMemo(
    () =>
      collectFacetOptions(
        items.flatMap((journal) => getJournalSubjects(journal)),
      ),
    [items],
  );

  const countryOptions = useMemo(
    () =>
      collectFacetOptions(items.map((journal) => getJournalCountry(journal))),
    [items],
  );

  const publisherOptions = useMemo(
    () =>
      collectFacetOptions(
        items.map((journal) => getJournalPublisher(journal)),
      ),
    [items],
  );

  const filteredJournals = useMemo(() => {
    const matched = items.filter((journal) =>
      matchesJournalFilters(journal, searchQuery, filters),
    );

    if (!searchQuery.trim()) {
      return matched;
    }

    // Partial-match relevance: exact / prefix / contains first.
    return [...matched].sort(
      (left, right) =>
        journalPartialScore(right, searchQuery) -
        journalPartialScore(left, searchQuery),
    );
  }, [items, searchQuery, filters]);

  // Journals API has no `q` param — keep loading pages while searching
  // until we have enough partial matches or run out of catalog pages.
  useEffect(() => {
    if (!searchQuery.trim() || isLoading || isLoadingMore || !hasMore) {
      return;
    }
    if (filteredJournals.length >= itemsPerPage) {
      return;
    }
    void loadMore();
  }, [
    searchQuery,
    filteredJournals.length,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    itemsPerPage,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJournals.length / itemsPerPage),
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJournals = filteredJournals.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage]);

  const handleFilterChange = (
    category: "subjectAreas" | "countries" | "publishers",
    value: string,
  ) => {
    setCurrentPage(1);
    setFilters((prev) => {
      const currentValues = prev[category];
      const isSelected = currentValues.some(
        (entry) => normalizeFacet(entry) === normalizeFacet(value),
      );

      return {
        ...prev,
        [category]: isSelected
          ? currentValues.filter(
              (entry) => normalizeFacet(entry) !== normalizeFacet(value),
            )
          : [...currentValues, value],
      };
    });
  };

  const clearAllFilters = () => {
    setCurrentPage(1);
    setFilters({
      subjectAreas: [],
      countries: [],
      publishers: [],
      openAccess: false,
      oaDiamond: false,
    });
  };

  const isFacetSelected = (selected: string[], value: string) =>
    selected.some((entry) => normalizeFacet(entry) === normalizeFacet(value));

  const activeFilterCount =
    filters.subjectAreas.length +
    filters.countries.length +
    filters.publishers.length +
    (filters.openAccess ? 1 : 0) +
    (filters.oaDiamond ? 1 : 0);

  return (
    <>
      <StudentTopHeader
        searchPlaceholder="Search journals by name..."
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
      />

      <ListPageMain>
        <PageContainer
          size="wide"
          className="flex-1 min-h-0 flex flex-col gap-4 py-6"
        >
          {/* Page Header */}
          <div className="shrink-0 space-y-4">
          <div>
            <h1 className="font-heading text-3xl text-foreground">
              Journal Search
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover academic journals across all disciplines
            </p>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="journal-name-search"
              className="text-sm font-medium"
            >
              Search by journal name
            </Label>
            <div className="relative max-w-2xl">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                id="journal-name-search"
                type="search"
                placeholder="Type a journal name…"
                className="pl-10 h-11 bg-card"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          </div>

          <div className="flex-1 min-h-0 flex gap-8">
            {/* Filters Sidebar */}
            {showFilters && (
              <aside className="w-72 flex-shrink-0 min-h-0">
                <Card className="p-6 border-border h-full min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-6 shrink-0">
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
                      onClick={clearAllFilters}
                      className="h-8 px-3 text-xs text-muted-foreground"
                    >
                      Clear all
                    </Button>
                  </div>

                  <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-2">
                    {/* Subject Area */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Subject Area
                      </h3>
                      {subjectAreaOptions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No subject data in the current results.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {subjectAreaOptions.map((subject) => (
                            <div
                              key={subject}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`subject-${subject}`}
                                checked={isFacetSelected(
                                  filters.subjectAreas,
                                  subject,
                                )}
                                onCheckedChange={() =>
                                  handleFilterChange("subjectAreas", subject)
                                }
                              />
                              <Label
                                htmlFor={`subject-${subject}`}
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                {subject}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Country */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Country
                      </h3>
                      {countryOptions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No country data in the current results.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {countryOptions.map((country) => (
                            <div
                              key={country}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`country-${country}`}
                                checked={isFacetSelected(
                                  filters.countries,
                                  country,
                                )}
                                onCheckedChange={() =>
                                  handleFilterChange("countries", country)
                                }
                              />
                              <Label
                                htmlFor={`country-${country}`}
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                {country}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Publisher */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Publisher
                      </h3>
                      {publisherOptions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No publisher data in the current results.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {publisherOptions.map((publisher) => (
                            <div
                              key={publisher}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`publisher-${publisher}`}
                                checked={isFacetSelected(
                                  filters.publishers,
                                  publisher,
                                )}
                                onCheckedChange={() =>
                                  handleFilterChange("publishers", publisher)
                                }
                              />
                              <Label
                                htmlFor={`publisher-${publisher}`}
                                className="text-sm text-muted-foreground cursor-pointer"
                              >
                                {publisher}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Open Access */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Access Type
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="open-access"
                            checked={filters.openAccess}
                            onCheckedChange={(checked) => {
                              setCurrentPage(1);
                              setFilters((prev) => ({
                                ...prev,
                                openAccess: checked === true,
                              }));
                            }}
                          />
                          <Label
                            htmlFor="open-access"
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            Open Access
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="oa-diamond"
                            checked={filters.oaDiamond}
                            onCheckedChange={(checked) => {
                              setCurrentPage(1);
                              setFilters((prev) => ({
                                ...prev,
                                oaDiamond: checked === true,
                              }));
                            }}
                          />
                          <Label
                            htmlFor="oa-diamond"
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            OA Diamond
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </aside>
            )}

            {/* Results Area */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col">
              {/* Results Header */}
              <div className="shrink-0 flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-9"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFilters ? "Hide Filters" : "Show Filters"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? (
                      "Loading journals..."
                    ) : (
                      <>
                        Showing{" "}
                        <span className="font-medium text-foreground">
                          {filteredJournals.length === 0
                            ? 0
                            : `${startIndex + 1}-${Math.min(endIndex, filteredJournals.length)}`}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-foreground">
                          {filteredJournals.length}
                          {hasMore ? "+" : ""}
                        </span>{" "}
                        journals
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Sort by:
                  </span>
                  <Button variant="outline" size="sm" className="h-9">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
                    {sortBy === "relevance" ? "Relevance" : sortBy}
                    <ChevronDown className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </div>
              </div>

              {error && (
                <Card className="p-6 border-border mb-4 shrink-0">
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

              {isLoading && <RouteDataLoading label="Loading journals…" />}

              {!isLoading && !error && currentJournals.length === 0 && (
                <Card className="p-8 border-border text-center text-muted-foreground">
                  No journals found. Try another search or clear your filters.
                </Card>
              )}

              {/* Journal Cards */}
              <ListScrollArea className="pr-1">
              <div className="space-y-4 pb-2">
                {currentJournals.map((journal) => {
                  const subjects = getJournalSubjects(journal);

                  return (
                    <Card
                      key={journal.id}
                      onClick={() =>
                        router.push(`/student/journals/${journal.id}`)
                      }
                      className="p-6 border-border  hover:border-border transition-all cursor-pointer"
                    >
                      <div className="flex gap-6">
                        <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-8 h-8 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Journal Name and Badges */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading text-lg text-foreground mb-1 hover:text-primary transition-colors line-clamp-1">
                                {getJournalName(journal)}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                <span className="flex-shrink-0">
                                  ISSN: {getJournalIssn(journal)}
                                </span>
                                <span className="text-border flex-shrink-0">
                                  •
                                </span>
                                <span className="truncate max-w-[200px]">
                                  {getJournalPublisher(journal)}
                                </span>
                                <span className="text-border flex-shrink-0">
                                  •
                                </span>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Globe className="w-3.5 h-3.5" />
                                  <span>{getJournalCountry(journal)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {journal.isOpenAccess && (
                                <div className="px-2.5 py-1 bg-teal/10 text-teal rounded-md flex items-center gap-1">
                                  <LockOpen className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">
                                    Open Access
                                  </span>
                                </div>
                              )}
                              {journal.isOaDiamond && (
                                <div className="px-2.5 py-1 bg-accent text-tag rounded-md flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">
                                    OA Diamond
                                  </span>
                                </div>
                              )}
                              {!journal.isOpenAccess && (
                                <div className="px-2.5 py-1 bg-surface-raised text-muted-foreground rounded-md flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span className="text-xs font-medium">
                                    Subscription
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {subjects.slice(0, 3).map((subject) => (
                              <span
                                key={subject}
                                className="px-3 py-1 bg-accent text-tag text-xs font-medium rounded-full"
                              >
                                {subject}
                              </span>
                            ))}
                            {subjects.length > 3 && (
                              <span className="px-3 py-1 bg-surface-raised text-muted-foreground text-xs font-medium rounded-full">
                                +{subjects.length - 3} more
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <BookOpen className="w-4 h-4" />
                              <span className="text-sm">
                                <span className="font-semibold text-foreground">
                                  {journal.articleCount.toLocaleString()}
                                </span>{" "}
                                articles in graph
                              </span>
                            </div>
                            {journal.coverage && (
                              <>
                                <div className="h-8 w-px bg-gray-200" />
                                <span className="text-sm text-muted-foreground">
                                  Coverage: {journal.coverage}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              </ListScrollArea>

              {/* Pagination */}
              {!isLoading && filteredJournals.length > 0 && (
                <div className="shrink-0 flex items-center justify-between mt-4 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={safePage === 1}
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
                          safePage === page
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
                      isLoadingMore || (safePage === totalPages && !hasMore)
                    }
                    onClick={() => {
                      if (safePage < totalPages) {
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

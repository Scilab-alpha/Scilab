"use client";

import { useMemo, useState } from "react";
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

const subjectAreas = [
  "Artificial Intelligence",
  "Machine Learning",
  "Climate Science",
  "Computational Biology",
  "Quantum Computing",
  "Genomics",
  "Environmental Science",
  "Materials Science",
];

const countries = [
  "United States",
  "United Kingdom",
  "Netherlands",
  "Germany",
  "China",
  "Japan",
];

const publishers = [
  "Nature Publishing Group",
  "Elsevier",
  "Springer",
  "Wiley",
  "Public Library of Science",
  "IOP Publishing",
  "BioMed Central",
];

const rankingMetrics = ["Impact Factor", "CiteScore", "h-Index", "SJR"];

function matchesJournalFilters(
  journal: JournalListItem,
  searchQuery: string,
  filters: {
    subjectAreas: string[];
    countries: string[];
    publishers: string[];
    openAccess: boolean;
    oaDiamond: boolean;
  },
) {
  const query = searchQuery.trim().toLowerCase();

  if (query) {
    const name = getJournalName(journal).toLowerCase();
    if (!name.includes(query)) {
      return false;
    }
  }

  if (
    filters.subjectAreas.length > 0 &&
    !filters.subjectAreas.some((subject) =>
      getJournalSubjects(journal).includes(subject),
    )
  ) {
    return false;
  }

  if (
    filters.countries.length > 0 &&
    !filters.countries.includes(getJournalCountry(journal))
  ) {
    return false;
  }

  if (
    filters.publishers.length > 0 &&
    !filters.publishers.includes(getJournalPublisher(journal))
  ) {
    return false;
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

  const [filters, setFilters] = useState({
    subjectAreas: [] as string[],
    countries: [] as string[],
    publishers: [] as string[],
    rankingMetrics: [] as string[],
    openAccess: false,
    oaDiamond: false,
  });

  const itemsPerPage = 8;

  const filteredJournals = useMemo(
    () =>
      items.filter((journal) =>
        matchesJournalFilters(journal, searchQuery, filters),
      ),
    [items, searchQuery, filters],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJournals.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJournals = filteredJournals.slice(startIndex, endIndex);

  const handleFilterChange = (category: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[category as keyof typeof prev] as string[];
      const isSelected = currentValues.includes(value);

      return {
        ...prev,
        [category]: isSelected
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value],
      };
    });
  };

  const clearAllFilters = () => {
    setFilters({
      subjectAreas: [],
      countries: [],
      publishers: [],
      rankingMetrics: [],
      openAccess: false,
      oaDiamond: false,
    });
  };

  const activeFilterCount =
    filters.subjectAreas.length +
    filters.countries.length +
    filters.publishers.length +
    filters.rankingMetrics.length +
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

      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-6">
          {/* Page Header */}
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

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            {showFilters && (
              <aside className="w-72 flex-shrink-0">
                <Card className="p-6 border-border sticky top-0">
                  <div className="flex items-center justify-between mb-6">
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

                  <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                    {/* Subject Area */}
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Subject Area
                      </h3>
                      <div className="space-y-2">
                        {subjectAreas.slice(0, 5).map((subject) => (
                          <div
                            key={subject}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`subject-${subject}`}
                              checked={filters.subjectAreas.includes(subject)}
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
                    </div>

                    {/* Country */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Country
                      </h3>
                      <div className="space-y-2">
                        {countries.slice(0, 5).map((country) => (
                          <div
                            key={country}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`country-${country}`}
                              checked={filters.countries.includes(country)}
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
                    </div>

                    {/* Publisher */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Publisher
                      </h3>
                      <div className="space-y-2">
                        {publishers.slice(0, 5).map((publisher) => (
                          <div
                            key={publisher}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`publisher-${publisher}`}
                              checked={filters.publishers.includes(publisher)}
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
                    </div>

                    {/* Ranking Metric */}
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        Ranking Metric
                      </h3>
                      <div className="space-y-2">
                        {rankingMetrics.map((metric) => (
                          <div key={metric} className="flex items-center gap-2">
                            <Checkbox
                              id={`metric-${metric}`}
                              checked={filters.rankingMetrics.includes(metric)}
                              onCheckedChange={() =>
                                handleFilterChange("rankingMetrics", metric)
                              }
                            />
                            <Label
                              htmlFor={`metric-${metric}`}
                              className="text-sm text-muted-foreground cursor-pointer"
                            >
                              {metric}
                            </Label>
                          </div>
                        ))}
                      </div>
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
                            onCheckedChange={(checked) =>
                              setFilters({
                                ...filters,
                                openAccess: checked as boolean,
                              })
                            }
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
                            onCheckedChange={(checked) =>
                              setFilters({
                                ...filters,
                                oaDiamond: checked as boolean,
                              })
                            }
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
            <div className="flex-1 min-w-0">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
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
                <Card className="p-6 border-border mb-4">
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
              <div className="space-y-4">
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

              {/* Pagination */}
              {!isLoading && filteredJournals.length > 0 && (
                <div className="flex items-center justify-between mt-8">
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
      </main>
    </>
  );
}

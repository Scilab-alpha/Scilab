"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Trophy,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { ListPageMain } from "@/shared/components/layout/ListPageScroll";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import { useJournalRankings } from "@/features/laboratories/hooks/use-journal-rankings";
import {
  DEFAULT_JOURNAL_RANKING_YEAR,
  JOURNAL_RANKING_YEARS,
  type JournalRankingItem,
} from "@/features/laboratories/types/journal-ranking.types";
import { cn } from "@/shared/components/ui/utils";

/**
 * Single viewport for both axes so the horizontal scrollbar stays visible,
 * plus click-drag panning and Shift+wheel horizontal scroll.
 */
function RankingsTableViewport({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);
  const suppressClick = useRef(false);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      // Trackpads already send deltaX; mice usually need Shift+wheel.
      if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        el.scrollLeft += event.deltaY;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, select, textarea, label")) {
        return;
      }

      drag.current = {
        active: true,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
      setGrabbing(true);
      el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      const state = drag.current;
      if (!state?.active) {
        return;
      }
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        state.moved = true;
      }
      el.scrollLeft = state.scrollLeft - dx;
      el.scrollTop = state.scrollTop - dy;
    };

    const endDrag = (event: PointerEvent) => {
      const state = drag.current;
      if (!state?.active) {
        return;
      }
      if (state.moved) {
        suppressClick.current = true;
      }
      drag.current = null;
      setGrabbing(false);
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick.current) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "flex-1 min-h-0 overflow-auto overscroll-contain",
        grabbing ? "cursor-grabbing select-none" : "cursor-grab",
      )}
    >
      {children}
    </div>
  );
}

const PAGE_SIZE = 25;

const COUNTRY_LABELS: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  NL: "Netherlands",
  DE: "Germany",
  CN: "China",
  JP: "Japan",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  CA: "Canada",
  AU: "Australia",
  KR: "South Korea",
  IN: "India",
  BR: "Brazil",
  CH: "Switzerland",
  SE: "Sweden",
  PL: "Poland",
  BE: "Belgium",
  SG: "Singapore",
  TW: "Taiwan",
};

type DraftFilters = {
  type: string;
  country: string;
  matchedOnly: boolean;
  minDocs: string;
  search: string;
};

const EMPTY_FILTERS: DraftFilters = {
  type: "all",
  country: "all",
  matchedOnly: false,
  minDocs: "0",
  search: "",
};

function formatNumber(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits > 0 ? Math.min(digits, 2) : 0,
  });
}

function countryLabel(code: string | null) {
  if (!code) {
    return "—";
  }
  return COUNTRY_LABELS[code] ?? code;
}

function matchesFilters(item: JournalRankingItem, filters: DraftFilters) {
  if (filters.type !== "all") {
    const type = item.type?.trim().toLowerCase() ?? "";
    if (type !== filters.type) {
      return false;
    }
  }

  if (filters.country !== "all") {
    if ((item.countryCode ?? "").toUpperCase() !== filters.country) {
      return false;
    }
  }

  if (filters.matchedOnly && item.matchStatus !== "MATCHED") {
    return false;
  }

  const minDocs = Number(filters.minDocs);
  if (Number.isFinite(minDocs) && minDocs > 0) {
    if ((item.citableDocs3Years ?? 0) < minDocs) {
      return false;
    }
  }

  const query = filters.search.trim().toLowerCase();
  if (query) {
    const haystack = [
      item.title,
      item.type ?? "",
      item.countryCode ?? "",
      ...item.issns,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(query)) {
      return false;
    }
  }

  return true;
}

function downloadCsv(rows: JournalRankingItem[], year: number) {
  const headers = [
    "Rank",
    "Title",
    "Type",
    "SJR",
    "H index",
    `Total Docs. (${year})`,
    "Total Docs. (3years)",
    `Total Refs. (${year})`,
    "Total Citations (3years)",
    "Citable Docs. (3years)",
    "Citations / Doc. (2years)",
    `Ref. / Doc. (${year})`,
    `% Female (${year})`,
    "Country",
    "ISSNs",
    "Match status",
  ];

  const lines = rows.map((item, index) =>
    [
      index + 1,
      `"${item.title.replaceAll('"', '""')}"`,
      item.type ?? "",
      item.sjr ?? "",
      item.hIndex ?? "",
      item.totalDocs ?? "",
      item.totalDocs3Years ?? "",
      item.totalRefs ?? "",
      item.totalCitations3Years ?? "",
      item.citableDocs3Years ?? "",
      item.citationsPerDoc2Years ?? "",
      item.refsPerDoc ?? "",
      item.femalePercentage ?? "",
      item.countryCode ?? "",
      item.issns.join("; "),
      item.matchStatus,
    ].join(","),
  );

  const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `scimago-journal-rankings-${year}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** SCImago-style journal rankings for student / research users. */
export default function JournalRankings() {
  const router = useRouter();
  const [year, setYear] = useState<number>(DEFAULT_JOURNAL_RANKING_YEAR);
  const [draft, setDraft] = useState<DraftFilters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<DraftFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const { items, isLoading, isLoadingMore, hasMore, error, reload, loadMore } =
    useJournalRankings(year);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const type = item.type?.trim().toLowerCase();
      if (type) {
        set.add(type);
      }
    }
    return [...set].sort();
  }, [items]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.countryCode) {
        set.add(item.countryCode.toUpperCase());
      }
    }
    return [...set].sort((a, b) =>
      countryLabel(a).localeCompare(countryLabel(b)),
    );
  }, [items]);

  const filtered = useMemo(
    () => items.filter((item) => matchesFilters(item, applied)),
    [items, applied],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const applyFilters = () => {
    setApplied(draft);
    setPage(1);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };

  const goNextPage = async () => {
    if (currentPage < totalPages) {
      setPage(currentPage + 1);
      return;
    }
    if (hasMore) {
      const loaded = await loadMore();
      if (loaded) {
        setPage(currentPage + 1);
      }
    }
  };

  return (
    <>
      <StudentTopHeader
        searchPlaceholder="Search rankings by title or ISSN…"
        searchValue={draft.search}
        onSearchChange={(value) => {
          setDraft((previous) => ({ ...previous, search: value }));
          setApplied((previous) => ({ ...previous, search: value }));
          setPage(1);
        }}
      />

      <ListPageMain>
        <PageContainer
          size="wide"
          className="flex-1 min-h-0 flex flex-col gap-4 py-6"
        >
          <div className="shrink-0 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  <h1 className="font-heading text-3xl text-foreground">
                    Rankings
                  </h1>
                </div>
                <p className="text-muted-foreground mt-1">
                  SCImago Journal Rankings for researchers and students.
                </p>
              </div>
              <Button
                variant="outline"
                className="h-10"
                disabled={filtered.length === 0}
                onClick={() => downloadCsv(filtered, year)}
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <Card className="p-5 border-border space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 min-w-[140px]">
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Select
                  value={String(year)}
                  onValueChange={(value) => {
                    setYear(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 rounded-full bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOURNAL_RANKING_YEARS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-[160px]">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select
                  value={draft.type}
                  onValueChange={(value) =>
                    setDraft((previous) => ({ ...previous, type: value }))
                  }
                >
                  <SelectTrigger className="h-10 rounded-full bg-card">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {typeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-[200px]">
                <Label className="text-xs text-muted-foreground">
                  Region / country
                </Label>
                <Select
                  value={draft.country}
                  onValueChange={(value) =>
                    setDraft((previous) => ({ ...previous, country: value }))
                  }
                >
                  <SelectTrigger className="h-10 rounded-full bg-card">
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All regions / countries</SelectItem>
                    {countryOptions.map((code) => (
                      <SelectItem key={code} value={code}>
                        {countryLabel(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                className="h-10 text-primary"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.matchedOnly}
                  onCheckedChange={(checked) =>
                    setDraft((previous) => ({
                      ...previous,
                      matchedOnly: checked,
                    }))
                  }
                  id="matched-only"
                />
                <Label htmlFor="matched-only" className="text-sm font-normal">
                  Only matched catalog journals
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label
                  htmlFor="min-docs"
                  className="text-sm font-normal whitespace-nowrap"
                >
                  Display journals with at least
                </Label>
                <Input
                  id="min-docs"
                  type="number"
                  min={0}
                  className="h-9 w-20"
                  value={draft.minDocs}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      minDocs: event.target.value,
                    }))
                  }
                />
                <span className="text-sm text-muted-foreground">
                  Citable Docs. (3years)
                </span>
              </div>

              <Button className="h-10 ml-auto" onClick={applyFilters}>
                Apply
              </Button>
            </div>
          </Card>
          </div>

          {error && (
            <Card className="p-6 border-border shrink-0">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </Card>
          )}

          {isLoading && <RouteDataLoading label="Loading journal rankings…" />}

          {!isLoading && !error && (
            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  {filtered.length.toLocaleString()} journals
                  {hasMore ? " loaded" : ""}
                  {applied.search ||
                  applied.type !== "all" ||
                  applied.country !== "all" ||
                  applied.matchedOnly ||
                  Number(applied.minDocs) > 0
                    ? " matching filters"
                    : ""}
                </p>
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoadingMore}
                    onClick={() => void loadMore()}
                  >
                    {isLoadingMore ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Load more from catalog
                  </Button>
                )}
              </div>

              <Card className="border-border flex-1 min-h-0 overflow-hidden flex flex-col">
                <RankingsTableViewport>
                  <Table
                    className="w-max min-w-full"
                    containerClassName="overflow-visible w-max min-w-full"
                  >
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-14">#</TableHead>
                      <TableHead className="min-w-[240px]">Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">SJR</TableHead>
                      <TableHead className="text-right">H index</TableHead>
                      <TableHead className="text-right">
                        Total Docs. ({year})
                      </TableHead>
                      <TableHead className="text-right">
                        Total Docs. (3years)
                      </TableHead>
                      <TableHead className="text-right">
                        Total Refs. ({year})
                      </TableHead>
                      <TableHead className="text-right">
                        Total Citations (3years)
                      </TableHead>
                      <TableHead className="text-right">
                        Citable Docs. (3years)
                      </TableHead>
                      <TableHead className="text-right">
                        Citations / Doc. (2years)
                      </TableHead>
                      <TableHead className="text-right">
                        Ref. / Doc. ({year})
                      </TableHead>
                      <TableHead className="text-right">
                        % Female ({year})
                      </TableHead>
                      <TableHead>Country</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={14}
                          className="h-28 text-center text-muted-foreground"
                        >
                          No journals match the current filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageRows.map((item, index) => {
                        const rank = (currentPage - 1) * PAGE_SIZE + index + 1;
                        const canOpen = Boolean(item.journalId);
                        return (
                          <TableRow key={item.scimagoSourceId}>
                            <TableCell className="text-muted-foreground font-medium">
                              {rank}
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                className={`text-left font-medium inline-flex items-center gap-1.5 ${
                                  canOpen
                                    ? "text-primary hover:underline"
                                    : "text-foreground cursor-default"
                                }`}
                                disabled={!canOpen}
                                onClick={() => {
                                  if (item.journalId) {
                                    router.push(
                                      `/student/journals/${item.journalId}`,
                                    );
                                  }
                                }}
                              >
                                {item.title}
                                {canOpen ? (
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                ) : null}
                              </button>
                            </TableCell>
                            <TableCell className="capitalize text-muted-foreground">
                              {item.type ?? "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatNumber(item.sjr, 3)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.hIndex)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.totalDocs)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.totalDocs3Years)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.totalRefs)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.totalCitations3Years)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.citableDocs3Years)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.citationsPerDoc2Years, 2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.refsPerDoc, 2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(item.femalePercentage, 2)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {countryLabel(item.countryCode)}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                </RankingsTableViewport>
              </Card>

              <div className="shrink-0 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((previous) => previous - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage >= totalPages && (!hasMore || isLoadingMore)
                    }
                    onClick={() => void goNextPage()}
                  >
                    Next
                    {isLoadingMore ? (
                      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-1" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </PageContainer>
      </ListPageMain>
    </>
  );
}

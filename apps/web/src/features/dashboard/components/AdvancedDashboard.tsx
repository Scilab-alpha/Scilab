"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { FileText, Image as ImageIcon, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
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
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import Can from "@/shared/components/auth/Can";
import { useAdvancedDashboard } from "@/features/dashboard/hooks/use-advanced-dashboard";
import { heatmapCellClass } from "@/features/dashboard/lib/build-advanced-dashboard-insights";
import { useJournalRankings } from "@/features/laboratories/hooks/use-journal-rankings";
import {
  JOURNAL_RANKING_YEARS,
  type JournalRankingMatchStatus,
  type JournalRankingYear,
} from "@/features/experiments/types/journal.types";

const chartTooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "8px 12px",
};

export default function AdvancedDashboard() {
  const { data, isLoading, error, reload } = useAdvancedDashboard();

  return (
    <>
      <StudentTopHeader searchPlaceholder="Compare keywords, fields, and ranking trends..." />

      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp
                  className="w-5 h-5 text-primary"
                  strokeWidth={1.75}
                />
                <span className="text-sm font-medium text-tag">
                  Researcher Analytics
                </span>
              </div>
              <h1 className="font-heading text-3xl text-foreground">
                Advanced Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Compare keyword/topic activity from the loaded catalog snapshot
                and browse exact SCImago rankings.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={isLoading}
                onClick={() => void reload()}
              >
                Refresh
              </Button>
              <Can permission="export_report">
                <>
                  <Button variant="outline" size="sm" className="h-9" disabled>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Export PNG
                  </Button>
                  <Button variant="outline" size="sm" className="h-9" disabled>
                    <FileText className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </>
              </Can>
            </div>
          </div>

          {error && (
            <Card className="p-6 border-border">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </Card>
          )}

          {isLoading && (
            <RouteDataLoading label="Loading advanced analytics…" />
          )}

          {!isLoading && data && (
            <>
              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="font-heading text-lg text-foreground">
                    Multi-Keyword Comparison
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Publication volume by year for top topics & keywords ·{" "}
                    {data.coverageHint}
                  </p>
                </div>
                {data.keywordComparisonSeries.length === 0 ||
                data.keywordLines.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-16 text-center">
                    Not enough topic/keyword data in the backend snapshot yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={data.keywordComparisonSeries}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "var(--muted-foreground)",
                          fontSize: 12,
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                        tick={{
                          fill: "var(--muted-foreground)",
                          fontSize: 12,
                        }}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend />
                      {data.keywordLines.map((series) => (
                        <Line
                          key={series.key}
                          type="monotone"
                          dataKey={series.key}
                          name={series.label}
                          stroke={series.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card className="p-6">
                <div className="mb-6">
                  <h2 className="font-heading text-lg text-foreground">
                    Research Activity Heatmap
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Relative intensity (0–100) by field and publication year ·{" "}
                    {data.coverageHint}
                  </p>
                </div>
                {data.heatmapRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">
                    No heatmap rows are available in this backend snapshot.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="min-w-[640px]">
                      <div
                        className="grid gap-2"
                        style={{
                          gridTemplateColumns: `180px repeat(${data.heatmapColumns.length}, minmax(72px, 1fr))`,
                        }}
                      >
                        <div />
                        {data.heatmapColumns.map((column) => (
                          <div
                            key={column}
                            className="text-xs font-medium text-muted-foreground text-center py-1"
                          >
                            {column}
                          </div>
                        ))}

                        {data.heatmapRows.map((row) => (
                          <Fragment key={row.label}>
                            <div className="text-sm text-foreground flex items-center pr-3 truncate">
                              {row.label}
                            </div>
                            {row.values.map((value, index) => (
                              <div
                                key={`${row.label}-${data.heatmapColumns[index]}`}
                                className={`h-12 rounded-[var(--radius-button)] flex items-center justify-center text-xs font-medium ${heatmapCellClass(value)}`}
                                title={`${row.label} · ${data.heatmapColumns[index]}: ${value}`}
                              >
                                {value}
                              </div>
                            ))}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}
          <JournalRankingTable />
        </PageContainer>
      </main>
    </>
  );
}

const rankingPageSize = 20;

export function JournalRankingTable() {
  const [year, setYear] = useState<JournalRankingYear>(2025);
  const [pageIndex, setPageIndex] = useState(0);
  const ranking = useJournalRankings(year, rankingPageSize);
  const page = ranking.pages[pageIndex];

  const goNext = async () => {
    const nextIndex = pageIndex + 1;
    if (ranking.pages[nextIndex]) {
      setPageIndex(nextIndex);
      return;
    }
    if (!ranking.hasMore) return;
    const result = await ranking.loadMore();
    if (result.data?.pages[nextIndex]) {
      setPageIndex(nextIndex);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg text-foreground">
            SCImago Journal Rankings
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Exact {year} dataset returned by the academic ranking API
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Ranking year
          <select
            aria-label="Ranking year"
            className="h-9 rounded-lg border border-border bg-card px-3 text-foreground"
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value) as JournalRankingYear);
              setPageIndex(0);
            }}
          >
            {JOURNAL_RANKING_YEARS.map((availableYear) => (
              <option key={availableYear} value={availableYear}>
                {availableYear}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ranking.isLoading ? (
        <RouteDataLoading label={`Loading ${year} SCImago rankings…`} />
      ) : ranking.error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 px-6 pb-6"
        >
          <p className="text-sm text-destructive">{ranking.error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void ranking.reload()}
          >
            Try again
          </Button>
        </div>
      ) : !page || page.items.length === 0 ? (
        <p className="px-6 pb-10 text-center text-sm text-muted-foreground">
          No SCImago ranking records were returned for {year}.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API order</TableHead>
                <TableHead>Journal</TableHead>
                <TableHead>SJR</TableHead>
                <TableHead>H-index</TableHead>
                <TableHead>Docs ({year})</TableHead>
                <TableHead>Citations (3y)</TableHead>
                <TableHead>Citations / doc (2y)</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((item, index) => {
                const canOpen =
                  item.matchStatus === "MATCHED" && Boolean(item.journalId);
                return (
                  <TableRow key={item.scimagoSourceId}>
                    <TableCell>
                      {pageIndex * rankingPageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-80 whitespace-normal">
                        {canOpen ? (
                          <Link
                            href={`/student/journals/${encodeURIComponent(item.journalId!)}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground">
                            {item.title}
                          </span>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.issns.join(", ") || "No ISSN"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatRankingMetric(item.sjr)}</TableCell>
                    <TableCell>{formatRankingMetric(item.hIndex)}</TableCell>
                    <TableCell>{formatRankingMetric(item.totalDocs)}</TableCell>
                    <TableCell>
                      {formatRankingMetric(item.totalCitations3Years)}
                    </TableCell>
                    <TableCell>
                      {formatRankingMetric(item.citationsPerDoc2Years)}
                    </TableCell>
                    <TableCell>{item.countryCode ?? "—"}</TableCell>
                    <TableCell>
                      <RankingStatus status={item.matchStatus} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              API page {pageIndex + 1} · {page.items.length} records
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((value) => Math.max(0, value - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  (ranking.isLoadingMore && !ranking.pages[pageIndex + 1]) ||
                  (!ranking.pages[pageIndex + 1] && !ranking.hasMore)
                }
                onClick={() => void goNext()}
              >
                {ranking.isLoadingMore ? "Loading…" : "Next"}
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function RankingStatus({ status }: { status: JournalRankingMatchStatus }) {
  const variant =
    status === "MATCHED"
      ? "teal"
      : status === "CONFLICT"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}

function formatRankingMetric(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

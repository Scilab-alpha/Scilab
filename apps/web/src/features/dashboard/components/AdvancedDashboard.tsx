"use client";

import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";
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
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import Can from "@/shared/components/auth/Can";
import { useAdvancedDashboard } from "@/features/dashboard/hooks/use-advanced-dashboard";
import { heatmapCellClass } from "@/features/dashboard/lib/build-advanced-dashboard-insights";

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
                Compare keywords/topics, explore activity heatmaps, and track
                journal ranking from the live catalog.
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
                    {data.sampleHint}
                  </p>
                </div>
                {data.keywordComparisonSeries.length === 0 ||
                data.keywordLines.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-16 text-center">
                    Not enough topic/keyword data in the catalog sample yet.
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
                    Relative intensity (0–100) by field and publication year
                  </p>
                </div>
                {data.heatmapRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">
                    No heatmap rows available for this sample.
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

              <Card className="p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-lg text-foreground">
                      Journal Ranking Progress
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Ranked by article volume in the catalog sample
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/journals">Browse journals</Link>
                  </Button>
                </div>

                {data.rankingProgress.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">
                    No journal ranking data in this sample.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {data.rankingProgress.map((item) => {
                      const improved = item.currentRank < item.previousRank;

                      return (
                        <div
                          key={item.id}
                          className="rounded-[var(--radius-card)] border border-border p-5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                            <div>
                              <Link
                                href={`/student/journals/${encodeURIComponent(item.id)}`}
                                className="text-sm font-medium text-foreground hover:underline"
                              >
                                {item.journal}
                              </Link>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Current rank #{item.currentRank} · was #
                                {item.previousRank} · {item.articleCount}{" "}
                                articles in sample
                              </p>
                            </div>
                            <div
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-button)] text-xs font-medium ${
                                improved
                                  ? "bg-teal/10 text-teal"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {improved ? (
                                <ArrowUp
                                  className="w-3.5 h-3.5"
                                  strokeWidth={1.75}
                                />
                              ) : (
                                <ArrowDown
                                  className="w-3.5 h-3.5"
                                  strokeWidth={1.75}
                                />
                              )}
                              {improved ? "Improved" : "Declined"}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {item.timeline.map((point) => (
                              <div
                                key={`${item.id}-${point.period}`}
                                className="space-y-2"
                              >
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{point.period}</span>
                                  <span className="font-medium text-foreground">
                                    #{point.rank}
                                  </span>
                                </div>
                                <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-teal rounded-full transition-all"
                                    style={{
                                      width: `${Math.max(
                                        8,
                                        ((Math.max(item.previousRank, 6) -
                                          point.rank +
                                          1) /
                                          Math.max(item.previousRank, 6)) *
                                          100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </>
          )}
        </PageContainer>
      </main>
    </>
  );
}

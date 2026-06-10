"use client";

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
import Can from "@/shared/components/auth/Can";
import {
  heatmapCellClass,
  heatmapColumns,
  heatmapRows,
  keywordComparisonSeries,
  keywordLines,
  rankingProgress,
} from "@/features/dashboard/api/mockAdvancedDashboardData";

const chartTooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "8px 12px",
};

export default function AdvancedDashboard() {
  return (
    <>
      <StudentTopHeader searchPlaceholder="Compare keywords, fields, and ranking trends..." />

      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" strokeWidth={1.75} />
                <span className="text-sm font-medium text-tag">Researcher Analytics</span>
              </div>
              <h1 className="font-heading text-3xl text-foreground">Advanced Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Compare multiple keywords, explore activity heatmaps, and track ranking progress.
              </p>
            </div>

            <Can permission="export_report">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-9">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Export PNG
                </Button>
                <Button variant="outline" size="sm" className="h-9">
                  <FileText className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </Can>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="font-heading text-lg text-foreground">Multi-Keyword Comparison</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Publication volume trends across selected research keywords
              </p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={keywordComparisonSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                {keywordLines.map((series) => (
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
          </Card>

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="font-heading text-lg text-foreground">Research Activity Heatmap</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Relative publication intensity by field and month
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `180px repeat(${heatmapColumns.length}, minmax(72px, 1fr))` }}
                >
                  <div />
                  {heatmapColumns.map((column) => (
                    <div key={column} className="text-xs font-medium text-muted-foreground text-center py-1">
                      {column}
                    </div>
                  ))}

                  {heatmapRows.map((row) => (
                    <Fragment key={row.label}>
                      <div className="text-sm text-foreground flex items-center pr-3">
                        {row.label}
                      </div>
                      {row.values.map((value, index) => (
                        <div
                          key={`${row.label}-${heatmapColumns[index]}`}
                          className={`h-12 rounded-[var(--radius-button)] flex items-center justify-center text-xs font-medium ${heatmapCellClass(value)}`}
                          title={`${row.label} · ${heatmapColumns[index]}: ${value}`}
                        >
                          {value}
                        </div>
                      ))}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-6">
              <h2 className="font-heading text-lg text-foreground">Journal Ranking Progress</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Quartile movement for followed journals over time
              </p>
            </div>

            <div className="space-y-6">
              {rankingProgress.map((item) => {
                const improved = item.currentRank < item.previousRank;

                return (
                  <div key={item.journal} className="rounded-[var(--radius-card)] border border-border p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{item.journal}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Current rank #{item.currentRank} · was #{item.previousRank}
                        </p>
                      </div>
                      <div
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-button)] text-xs font-medium ${
                          improved ? "bg-teal/10 text-teal" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {improved ? (
                          <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                        )}
                        {improved ? "Improved" : "Declined"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {item.timeline.map((point) => (
                        <div key={`${item.journal}-${point.period}`} className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{point.period}</span>
                            <span className="font-medium text-foreground">#{point.rank}</span>
                          </div>
                          <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal rounded-full transition-all"
                              style={{ width: `${((6 - point.rank) / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </PageContainer>
      </main>
    </>
  );
}

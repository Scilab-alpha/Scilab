"use client";

import Link from "next/link";
import {
  BookOpen,
  FileText,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Hash,
  Layers,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageContainer from "@/shared/components/layout/PageContainer";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import { useAuth } from "@/providers/auth-provider";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";

const CHART_PRIMARY = "#D3AB9E";
const CHART_TEAL = "#3AC9C1";

const statIcons = [BookOpen, FileText, Hash, Layers] as const;

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = useDashboard();

  const chartTooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 12px",
  };

  const displayName = user?.name?.trim() || "researcher";

  return (
    <>
      <StudentTopHeader />

      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {displayName}. Overview from your academic catalog.
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

          {isLoading && <RouteDataLoading label="Loading dashboard…" />}

          {!isLoading && data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.stats.map((stat, index) => {
                  const Icon = statIcons[index] ?? Layers;
                  return (
                    <Card key={stat.label} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="font-heading text-3xl text-foreground">
                            {stat.value.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-11 h-11 bg-accent rounded-[var(--radius-card)] flex items-center justify-center">
                          <Icon
                            className="w-6 h-6 text-primary"
                            strokeWidth={1.75}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-4">
                        {stat.changePercent !== null ? (
                          <>
                            {stat.direction === "down" ? (
                              <ArrowDown
                                className="w-4 h-4 text-destructive"
                                strokeWidth={1.75}
                              />
                            ) : (
                              <ArrowUp
                                className="w-4 h-4 text-teal"
                                strokeWidth={1.75}
                              />
                            )}
                            <span
                              className={`text-sm ${
                                stat.direction === "down"
                                  ? "text-destructive"
                                  : "text-teal"
                              }`}
                            >
                              {Math.abs(stat.changePercent)}%
                            </span>
                            <span className="text-sm text-muted-foreground">
                              vs prior year in sample
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {stat.hint}
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="mb-6">
                    <h3 className="font-heading text-lg text-foreground">
                      Publication Growth
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Articles by publication year in catalog sample
                    </p>
                  </div>
                  {data.publicationGrowth.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-16 text-center">
                      No year data in this sample yet.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={data.publicationGrowth}>
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
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Area
                          type="monotone"
                          dataKey="publications"
                          stroke={CHART_PRIMARY}
                          strokeWidth={2}
                          fill={CHART_PRIMARY}
                          fillOpacity={0.15}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                <Card className="p-6">
                  <div className="mb-6">
                    <h3 className="font-heading text-lg text-foreground">
                      Year Distribution
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      How sampled articles spread across years
                    </p>
                  </div>
                  {data.yearDistribution.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-16 text-center">
                      No distribution data yet.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.yearDistribution}>
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
                          tick={{
                            fill: "var(--muted-foreground)",
                            fontSize: 12,
                          }}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Bar
                          dataKey="articles"
                          fill={CHART_TEAL}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-heading text-lg text-foreground">
                      Trending Research Topics
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Most frequent topics & keywords in the sample
                    </p>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-xs text-tag"
                  >
                    <Link href="/student/trends">
                      View trends
                      <ChevronRight
                        className="w-3.5 h-3.5 ml-1"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </Button>
                </div>

                {data.trendingTopics.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No topics or keywords found on sampled articles.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.trendingTopics.map((item) => (
                      <div key={item.topic} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm text-foreground">
                              {item.topic}
                            </span>
                            <div
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-button)] text-xs ${
                                item.trend === "up"
                                  ? "bg-teal/10 text-teal"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {item.trend === "up" ? (
                                <ArrowUp
                                  className="w-3 h-3"
                                  strokeWidth={1.75}
                                />
                              ) : (
                                <ArrowDown
                                  className="w-3 h-3"
                                  strokeWidth={1.75}
                                />
                              )}
                              {Math.abs(item.change)}%
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-surface-raised rounded-full h-2">
                              <div
                                className="bg-teal rounded-full h-2 transition-all"
                                style={{
                                  width: `${Math.max(
                                    8,
                                    (item.count /
                                      Math.max(
                                        data.trendingTopics[0]?.count ?? 1,
                                        1,
                                      )) *
                                      100,
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground min-w-[60px] text-right">
                              {item.count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading text-lg text-foreground">
                      Top Journals
                    </h3>
                    <Button asChild variant="ghost" size="sm" className="h-8">
                      <Link href="/student/journals">Browse</Link>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {data.recentJournals.map((journal) => (
                      <Link
                        key={journal.id}
                        href={`/student/journals/${encodeURIComponent(journal.id)}`}
                        className="flex items-center gap-4 p-3 rounded-[var(--radius-card)] hover:bg-accent transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary rounded-[var(--radius-card)] flex items-center justify-center flex-shrink-0">
                          <BookOpen
                            className="w-5 h-5 text-primary-foreground"
                            strokeWidth={1.75}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {journal.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {journal.articles} articles
                            </span>
                            <span className="text-xs text-border">•</span>
                            <span className="text-xs text-muted-foreground">
                              {journal.lastUpdate}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-teal">
                          <ArrowUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span className="text-sm">{journal.trend}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading text-lg text-foreground">
                      Recent Publications
                    </h3>
                    <Button asChild variant="ghost" size="sm" className="h-8">
                      <Link href="/student/articles">Browse</Link>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {data.recentPublications.map((publication) => (
                      <Link
                        key={publication.id}
                        href={`/student/articles/${encodeURIComponent(publication.id)}`}
                        className="block p-3 rounded-[var(--radius-card)] hover:bg-accent transition-colors"
                      >
                        <p className="text-sm text-foreground mb-1 line-clamp-2">
                          {publication.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="truncate">
                            {publication.journal}
                          </span>
                          <span className="text-border">•</span>
                          <span>{publication.year ?? "—"}</span>
                          <span className="text-border">•</span>
                          <span>{publication.citations} outgoing refs</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>

              <p className="text-xs text-muted-foreground">
                Sample: {data.sampleSize.articles} articles
                {data.sampleSize.articlesHasMore ? "+" : ""} ·{" "}
                {data.sampleSize.journals} journals
                {data.sampleSize.journalsHasMore ? "+" : ""}. Metrics are
                computed from the live catalog, not mock data.
              </p>
            </>
          )}
        </PageContainer>
      </main>
    </>
  );
}

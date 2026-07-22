"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Bell,
  X,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Activity,
  BarChart3,
  FileText,
  Star,
  StarOff,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import PageContainer from "@/shared/components/layout/PageContainer";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import Can from "@/shared/components/auth/Can";
import { Label } from "@/shared/components/ui/label";
import {
  LineChart,
  Line,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "@/providers/auth-provider";
import { useTrendAnalysis } from "@/features/reports/hooks/use-trend-analysis";
import { toggleFollow } from "@/features/follows/api/follows.api";
import { isLocallyFollowing } from "@/features/follows/api/local-follows";
import type { FollowObjectType } from "@/features/follows/types/follow.types";

function MomentumBadge({
  momentum,
}: {
  momentum: "explosive" | "strong" | "growing";
}) {
  const configs = {
    explosive: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    strong: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    growing: { bg: "bg-accent", text: "text-tag", border: "border-border" },
  };
  const config = configs[momentum];
  return (
    <span
      className={`px-2.5 py-1 ${config.bg} ${config.text} text-xs font-semibold rounded-md border ${config.border} uppercase tracking-wide`}
    >
      {momentum}
    </span>
  );
}

export default function TrendAnalysis() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"1y" | "2y" | "5y" | "all">("all");
  const [selectedJournal, setSelectedJournal] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followPendingId, setFollowPendingId] = useState<string | null>(null);

  const { data, isLoading, error, reload } = useTrendAnalysis({
    journalId: selectedJournal,
    subject: selectedSubject,
    dateRange,
  });

  useEffect(() => {
    if (!data?.keywords.length) {
      return;
    }
    setSelectedKeywords((previous) => {
      if (previous.length === 0) {
        return data.keywords.slice(0, 3).map((keyword) => keyword.dataKey);
      }
      const available = new Set(
        data.keywords.map((keyword) => keyword.dataKey),
      );
      const kept = previous.filter((key) => available.has(key));
      return kept.length > 0
        ? kept
        : data.keywords.slice(0, 3).map((keyword) => keyword.dataKey);
    });
  }, [data?.keywords]);

  const chartTooltipStyle = useMemo(
    () => ({
      backgroundColor: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "8px",
      fontSize: "12px",
    }),
    [],
  );

  const toggleKeyword = (dataKey: string) => {
    setSelectedKeywords((previous) =>
      previous.includes(dataKey)
        ? previous.filter((key) => key !== dataKey)
        : [...previous, dataKey],
    );
  };

  const handleFollow = async (input: {
    id: string;
    topic: string;
    objectType: FollowObjectType;
  }) => {
    if (followPendingId) return;
    setFollowPendingId(input.id);
    try {
      const result = await toggleFollow({
        objectType: input.objectType,
        objectId: input.id,
        displayName: input.topic,
        notifyMode: "IN_APP",
      });
      setFollowedIds((previous) => {
        const next = new Set(previous);
        if (result.followed) {
          next.add(input.id);
        } else {
          next.delete(input.id);
        }
        return next;
      });
    } catch {
      // Keep prior follow state on failure.
    } finally {
      setFollowPendingId(null);
    }
  };

  const isFollowing = (id: string, objectType: FollowObjectType) =>
    followedIds.has(id) || isLocallyFollowing(objectType, id);

  const resetFilters = () => {
    setDateRange("all");
    setSelectedJournal("");
    setSelectedSubject("");
  };

  return (
    <>
      <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-lg text-foreground truncate">
              Trend Analysis
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              Live catalog topic & keyword intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Can permission="notifications">
            <Link
              href="/student/notifications"
              className="relative p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
            </Link>
          </Can>
          <Can permission="profile">
            <Link
              href="/student/profile"
              className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center"
            >
              <span className="text-sm font-medium text-tag">
                {user?.initials ?? "ME"}
              </span>
            </Link>
          </Can>
        </div>
      </header>

      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-6">
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-base font-semibold text-foreground">
                Analysis Filters
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={resetFilters}
              >
                Reset All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-range" className="text-sm font-medium">
                  Year window
                </Label>
                <select
                  id="date-range"
                  className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm"
                  value={dateRange}
                  onChange={(event) =>
                    setDateRange(
                      event.target.value as "1y" | "2y" | "5y" | "all",
                    )
                  }
                >
                  <option value="1y">Last year</option>
                  <option value="2y">Last 2 years</option>
                  <option value="5y">Last 5 years</option>
                  <option value="all">All years in sample</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="journal-filter" className="text-sm font-medium">
                  Journal
                </Label>
                <select
                  id="journal-filter"
                  className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm"
                  value={selectedJournal}
                  onChange={(event) => setSelectedJournal(event.target.value)}
                >
                  <option value="">All journals</option>
                  {(data?.journalOptions ?? []).map((journal) => (
                    <option key={journal.id} value={journal.id}>
                      {journal.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject-filter" className="text-sm font-medium">
                  Subject area
                </Label>
                <select
                  id="subject-filter"
                  className="w-full h-9 px-3 bg-card border border-border rounded-lg text-sm"
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                >
                  <option value="">All subjects</option>
                  {(data?.subjectOptions ?? []).map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {data && data.keywords.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-sm font-medium">Active series</Label>
                <div className="flex flex-wrap gap-2">
                  {data.keywords.map((keyword) => {
                    const active = selectedKeywords.includes(keyword.dataKey);
                    return (
                      <button
                        key={keyword.id}
                        type="button"
                        onClick={() => toggleKeyword(keyword.dataKey)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 max-w-xs ${
                          active
                            ? "text-white shadow-sm"
                            : "bg-surface-raised text-muted-foreground hover:bg-accent"
                        }`}
                        style={
                          active
                            ? { backgroundColor: keyword.color }
                            : undefined
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: keyword.color }}
                        />
                        <span className="truncate">{keyword.label}</span>
                        {active && <X className="w-3 h-3 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {error && (
            <Card className="p-6 border-border">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </Card>
          )}

          {isLoading && <RouteDataLoading label="Loading trend analysis…" />}

          {!isLoading && data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="p-6 border-border bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <TrendingUp
                        className="w-5 h-5 text-primary"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                  <p className="font-heading text-3xl text-foreground mb-1">
                    {data.metrics.totalPublications.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Publications in view
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {data.metrics.sampleHint}
                  </p>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <Zap
                        className="w-5 h-5 text-primary"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                  <p className="font-heading text-3xl text-foreground mb-1">
                    {data.metrics.yearlyAverage.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avg publications / year
                  </p>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Activity
                        className="w-5 h-5 text-orange-600"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                  <p className="font-heading text-3xl text-foreground mb-1">
                    {data.metrics.emergingCount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    High-momentum topics
                  </p>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <BarChart3
                        className="w-5 h-5 text-teal"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                  <p className="font-heading text-2xl text-foreground mb-1 truncate">
                    {data.metrics.topKeyword?.label ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Top trending label
                  </p>
                  {data.metrics.topKeyword && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.metrics.topKeyword.count.toLocaleString()} mentions
                    </p>
                  )}
                </Card>
              </div>

              <Card className="p-6 border-border bg-card">
                <div className="mb-6">
                  <h2 className="font-heading text-lg text-foreground">
                    Publication Trends
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Top topics/keywords by publication year
                  </p>
                </div>

                {data.multiTrend.length === 0 ||
                selectedKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-16 text-center">
                    Select at least one series to plot.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data.multiTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="year"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                        iconType="line"
                      />
                      {data.keywords
                        .filter((keyword) =>
                          selectedKeywords.includes(keyword.dataKey),
                        )
                        .map((keyword) => (
                          <Line
                            key={keyword.id}
                            type="monotone"
                            dataKey={keyword.dataKey}
                            stroke={keyword.color}
                            strokeWidth={2}
                            dot={false}
                            name={keyword.label}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border-border bg-card">
                  <div className="mb-6">
                    <h2 className="font-heading text-lg text-foreground">
                      Growth Comparison
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Newer half of years vs older half in the sample
                    </p>
                  </div>
                  <div className="space-y-4">
                    {data.growthComparison.map((item) => (
                      <div key={item.keyword} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm font-medium text-foreground truncate">
                              {item.keyword}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {item.previous} → {item.current}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 ${
                                item.growth >= 0
                                  ? "bg-teal/10 text-teal"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {item.growth >= 0 ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )}
                              {Math.abs(item.growth)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(Math.abs(item.growth), 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {data.growthComparison.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Not enough topic data for growth comparison.
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="mb-6">
                    <h2 className="font-heading text-lg text-foreground">
                      Publication Velocity
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Articles per year vs sample average
                    </p>
                  </div>
                  {data.velocityByYear.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-16 text-center">
                      No yearly velocity data.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <ComposedChart data={data.velocityByYear}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="year"
                          stroke="var(--muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Legend
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "10px",
                          }}
                        />
                        <Bar
                          dataKey="velocity"
                          fill="#3AC9C1"
                          radius={[4, 4, 0, 0]}
                          name="Publications"
                        />
                        <Line
                          type="monotone"
                          dataKey="avg"
                          stroke="#D3AB9E"
                          strokeWidth={1.75}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Average"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2 p-6 border-border bg-card">
                  <div className="mb-6">
                    <h2 className="font-heading text-lg text-foreground">
                      Emerging Topics
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Ranked by growth between older and newer years
                    </p>
                  </div>
                  <div className="space-y-3">
                    {data.emergingTopics.map((topic) => {
                      const following = isFollowing(topic.id, topic.objectType);
                      return (
                        <div
                          key={`${topic.objectType}-${topic.id}`}
                          className="flex items-center justify-between gap-4 p-4 bg-background hover:bg-accent rounded-lg border border-border transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-foreground truncate">
                                {topic.topic}
                              </h3>
                              <MomentumBadge momentum={topic.momentum} />
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                {topic.publications.toLocaleString()} mentions
                              </span>
                              <span
                                className={`flex items-center gap-1 font-semibold ${
                                  topic.growth >= 0
                                    ? "text-teal"
                                    : "text-destructive"
                                }`}
                              >
                                {topic.growth >= 0 ? (
                                  <ArrowUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5" />
                                )}
                                {Math.abs(topic.growth)}% growth
                              </span>
                            </div>
                          </div>
                          <Can permission="follow">
                            <Button
                              variant={following ? "default" : "outline"}
                              size="sm"
                              className="h-8 px-3"
                              disabled={followPendingId === topic.id}
                              onClick={() =>
                                void handleFollow({
                                  id: topic.id,
                                  topic: topic.topic,
                                  objectType: topic.objectType,
                                })
                              }
                            >
                              {following ? (
                                <>
                                  <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
                                  Following
                                </>
                              ) : (
                                <>
                                  <StarOff className="w-3.5 h-3.5 mr-1.5" />
                                  Follow
                                </>
                              )}
                            </Button>
                          </Can>
                        </div>
                      );
                    })}
                    {data.emergingTopics.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No emerging topics in the current filter.
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border-border bg-card">
                  <div className="mb-6">
                    <h2 className="font-heading text-lg text-foreground">
                      Top Journals
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Share of filtered publications
                    </p>
                  </div>
                  <div className="space-y-4">
                    {data.topJournals.map((journal, index) => (
                      <Link
                        key={journal.id}
                        href={`/student/journals/${encodeURIComponent(journal.id)}`}
                        className="block space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm font-semibold text-foreground flex-shrink-0">
                              {index + 1}.
                            </span>
                            <span className="text-sm font-medium text-foreground truncate">
                              {journal.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {journal.trend === "up" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-teal" />
                            ) : journal.trend === "down" ? (
                              <ArrowDown className="w-3.5 h-3.5 text-destructive" />
                            ) : (
                              <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span className="text-sm font-semibold text-foreground">
                              {journal.share}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-surface-raised rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal rounded-full"
                              style={{
                                width: `${Math.min(journal.share * 2, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {journal.publications}
                          </span>
                        </div>
                      </Link>
                    ))}
                    {data.topJournals.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No journal share data for this filter.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </PageContainer>
      </main>
    </>
  );
}

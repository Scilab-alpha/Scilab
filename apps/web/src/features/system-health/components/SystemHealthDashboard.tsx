"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  FileText,
  Hash,
  RefreshCw,
  ServerCrash,
  Timer,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminShell from "@/shared/components/layout/AdminShell";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { mockSystemHealth } from "@/features/system-health/api/mockSystemHealth";
import type {
  ErrorSeverity,
  PlatformMetric,
  SyncStatus,
  SystemHealthSnapshot,
} from "@/features/system-health/types/system-health.types";

const metricIcons: Record<string, React.ReactNode> = {
  journals: <BookOpen className="w-5 h-5 text-primary" strokeWidth={1.75} />,
  articles: <FileText className="w-5 h-5 text-primary" strokeWidth={1.75} />,
  authors: <Users className="w-5 h-5 text-primary" strokeWidth={1.75} />,
  keywords: <Hash className="w-5 h-5 text-teal" strokeWidth={1.75} />,
};

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function getOverallStatus(status: SystemHealthSnapshot["overallStatus"]) {
  switch (status) {
    case "operational":
      return {
        label: "All Systems Operational",
        className: "bg-teal/10 text-teal border-border",
        dot: "bg-green-500",
      };
    case "degraded":
      return {
        label: "Degraded Performance",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
    case "incident":
      return {
        label: "Active Incident",
        className: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
      };
  }
}

function getSyncStatusStyles(status: SyncStatus) {
  switch (status) {
    case "success":
      return "bg-teal/10 text-teal border-border";
    case "running":
      return "bg-accent text-tag border-border";
    case "delayed":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
  }
}

function getSeverityStyles(severity: ErrorSeverity) {
  switch (severity) {
    case "critical":
      return "bg-red-50 text-red-700 border-red-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "info":
      return "bg-accent text-tag border-border";
  }
}

function MetricWidget({ metric }: { metric: PlatformMetric }) {
  const isUp = metric.trend === "up";

  return (
    <Card className="p-5 border-border bg-card  transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
          {metricIcons[metric.id]}
        </div>
        <div
          className={`flex items-center gap-1 text-xs font-medium ${
            isUp ? "text-teal" : "text-red-600"
          }`}
        >
          {isUp ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
          {Math.abs(metric.change)}%
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
      <p className="font-heading text-3xl text-foreground mt-1 tracking-tight">
        {formatNumber(metric.value)}
      </p>
    </Card>
  );
}

export default function SystemHealthDashboard() {
  const data = mockSystemHealth;
  const overall = getOverallStatus(data.overallStatus);

  const failedSyncs = useMemo(
    () => data.syncJobs.filter((job) => job.status === "failed").length,
    [data.syncJobs],
  );

  const chartTooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
  };

  return (
    <AdminShell
      title="System Health"
      subtitle={`${data.uptimePercent}% uptime · last 24 hours`}
      icon={<Activity className="w-5 h-5 text-primary-foreground" strokeWidth={1.75} />}
      headerAction={
        <Button variant="outline" className="bg-card">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Status banner */}
        <Card className="p-4 border-border bg-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${overall.className}`}
              >
                <span className={`w-2 h-2 rounded-full ${overall.dot} animate-pulse`} />
                {overall.label}
              </span>
              <span className="text-sm text-muted-foreground">
                Monitoring ingestion pipelines, API adapters, and platform services
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Wifi className="w-4 h-4 text-teal" />
                {data.syncJobs.filter((j) => j.status === "success").length} syncs OK
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Timer className="w-4 h-4 text-amber-600" />
                {data.syncJobs.filter((j) => j.status === "delayed").length} delayed
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <WifiOff className="w-4 h-4 text-red-600" />
                {failedSyncs} failed
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <ServerCrash className="w-4 h-4 text-red-600" />
                {data.apiFailures.length} API failures
              </span>
            </div>
          </div>
        </Card>

        {/* Platform metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {data.metrics.map((metric) => (
            <MetricWidget key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="p-5 border-border bg-card xl:col-span-1">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Sync Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Records synced vs duration (24h)</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.syncPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  unit="s"
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line yAxisId="left" type="monotone" dataKey="records" stroke="#D3AB9E" strokeWidth={1.75} dot={false} name="Records" />
                <Line yAxisId="right" type="monotone" dataKey="duration" stroke="#3AC9C1" strokeWidth={1.75} dot={false} name="Duration (s)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 border-border bg-card xl:col-span-1">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">Data Growth</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Platform catalog expansion (6 months)</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.dataGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="articles" stroke="#D3AB9E" strokeWidth={1.75} fill="#D3AB9E" fillOpacity={0.15} name="Articles" />
                <Line type="monotone" dataKey="journals" stroke="#3AC9C1" strokeWidth={1.75} dot={false} name="Journals" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5 border-border bg-card xl:col-span-1">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">API Availability</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Provider uptime % (24h rolling)</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.apiAvailability}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  domain={[94, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  unit="%"
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="openalex" fill="#D3AB9E" radius={[2, 2, 0, 0]} name="OpenAlex" />
                <Bar dataKey="crossref" fill="#3AC9C1" radius={[2, 2, 0, 0]} name="Crossref" />
                <Bar dataKey="semanticScholar" fill="#8AAFA8" radius={[2, 2, 0, 0]} name="Semantic Scholar" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Sync monitoring + Error summary */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Sync Monitoring</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Ingestion jobs across data providers</p>
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Source
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Last Sync
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Records Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.syncJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-background/80">
                      <td className="py-3.5 px-6 font-medium text-foreground">{job.source}</td>
                      <td className="py-3.5 px-6 text-muted-foreground font-mono text-xs">
                        {formatTimestamp(job.lastSyncTime)}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium capitalize ${getSyncStatusStyles(job.status)}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="font-semibold text-foreground">
                          {formatNumber(job.recordsUpdated)}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDuration(job.durationMs)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Recent Failures</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Latest pipeline and sync incidents</p>
              </div>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="divide-y divide-border">
              {data.recentFailures.map((failure) => (
                <div key={failure.id} className="px-6 py-4 hover:bg-background/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{failure.service}</span>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${getSeverityStyles(failure.severity)}`}
                        >
                          {failure.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{failure.message}</p>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
                      {formatTimestamp(failure.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Error logs + API failures */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-surface-raised">
              <h3 className="font-heading text-sm text-foreground font-mono">Error Logs</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Live platform event stream</p>
            </div>
            <div className="bg-background max-h-[320px] overflow-y-auto">
              {data.errorLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 border-b border-border font-mono text-xs hover:bg-accent/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                        log.severity === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : log.severity === "warning"
                            ? "bg-primary/15 text-tag"
                            : "bg-teal/10 text-teal"
                      }`}
                    >
                      {log.severity}
                    </span>
                    <span className="text-tag">[{log.service}]</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{log.message}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">API Failures</h3>
              <p className="text-xs text-muted-foreground mt-0.5">External provider errors (last 24h)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Endpoint
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Code
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.apiFailures.map((failure) => (
                    <tr key={failure.id} className="hover:bg-background/80">
                      <td className="py-3.5 px-6 font-medium text-foreground">{failure.provider}</td>
                      <td className="py-3.5 px-6 font-mono text-xs text-muted-foreground">
                        {failure.endpoint}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-bold font-mono ${
                            failure.statusCode >= 500
                              ? "bg-red-50 text-red-700"
                              : failure.statusCode === 429
                                ? "bg-amber-50 text-amber-700"
                                : "bg-surface-raised text-muted-foreground"
                          }`}
                        >
                          {failure.statusCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-xs font-mono text-muted-foreground">
                        {formatTimestamp(failure.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-border bg-background">
              <p className="text-xs text-muted-foreground">
                {failureSummary(data.apiFailures.length)} — correlate with API Sources configuration
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

function failureSummary(count: number) {
  if (count === 0) return "No API failures detected";
  if (count === 1) return "1 API failure detected in the last 24 hours";
  return `${count} API failures detected in the last 24 hours`;
}

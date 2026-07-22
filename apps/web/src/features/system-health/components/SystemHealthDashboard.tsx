"use client";

import { useState } from "react";
import { Activity, Database, RefreshCw, TimerReset } from "lucide-react";
import { useSystemHealth } from "@/features/system-health/hooks/use-system-health";
import type { AdminAcademicJob } from "@/features/system-health/types/system-health.types";
import AdminPageFrame from "@/shared/components/layout/AdminPageFrame";
import { FeatureUnavailable } from "@/shared/components/layout/FeatureUnavailable";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

const pageSize = 20;

export default function SystemHealthDashboard() {
  const [page, setPage] = useState(1);
  const health = useSystemHealth(page, pageSize);
  const running = health.jobs.filter((job) => job.status === "running").length;
  const paused = health.jobs.filter(
    (job) => job.schedulerStatus === "paused",
  ).length;
  const failed = health.jobs.filter((job) => job.status === "failed").length;
  const pagination = health.logs?.pagination;
  const metricsAvailable = !health.jobsLoading && !health.jobsError;

  return (
    <AdminPageFrame
      title="System Health"
      subtitle="Academic sync jobs and execution logs from the backend"
      icon={<Activity className="size-5" strokeWidth={1.75} />}
      headerAction={
        <Button
          variant="outline"
          size="sm"
          disabled={health.isFetching}
          onClick={() => void health.reload()}
        >
          <RefreshCw
            className={health.isFetching ? "animate-spin" : undefined}
          />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Configured jobs"
            value={metricsAvailable ? health.jobs.length : null}
          />
          <MetricCard
            label="Running"
            value={metricsAvailable ? running : null}
          />
          <MetricCard label="Paused" value={metricsAvailable ? paused : null} />
          <MetricCard label="Failed" value={metricsAvailable ? failed : null} />
        </section>

        <DataCard
          title="Academic sync jobs"
          description="Current scheduler and execution state reported by /admin/jobs."
          loading={health.jobsLoading}
          error={health.jobsError}
          onRetry={() => void health.reload()}
        >
          {health.jobs.length === 0 ? (
            <EmptyState message="No sync jobs returned by the backend." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last run</TableHead>
                  <TableHead>Next run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health.jobs.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </TableBody>
            </Table>
          )}
        </DataCard>

        <DataCard
          title="Sync logs"
          description="Latest synchronization outcomes reported by /admin/sync-logs."
          loading={health.logsLoading}
          error={health.logsError}
          onRetry={() => void health.reload()}
        >
          {!health.logs || health.logs.items.length === 0 ? (
            <EmptyState message="No sync logs returned by the backend." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Data type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Finished</TableHead>
                    <TableHead>Success</TableHead>
                    <TableHead>Failed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {health.logs.items.map((log) => (
                    <TableRow key={log.id} title={log.errorDetail ?? undefined}>
                      <TableCell>{humanize(log.source)}</TableCell>
                      <TableCell>{humanize(log.dataType)}</TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(log.startedAt)}</TableCell>
                      <TableCell>{formatDateTime(log.finishedAt)}</TableCell>
                      <TableCell>{log.successCount.toLocaleString()}</TableCell>
                      <TableCell>{log.failureCount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t border-border px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination?.page ?? page} of{" "}
                  {pagination?.totalPages ?? 1}
                  {pagination ? ` · ${pagination.totalItems} logs` : ""}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || health.logsLoading}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      health.logsLoading ||
                      !pagination ||
                      page >= pagination.totalPages
                    }
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </DataCard>

        <FeatureUnavailable
          feature="Health history and provider availability"
          description="The backend does not currently expose health-history, uptime, growth, or provider-availability APIs. No synthetic metrics are shown."
        />
      </div>
    </AdminPageFrame>
  );
}

function MetricCard({ label, value }: { label: string; value: number | null }) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Database className="size-4" aria-hidden="true" />
        <span className="text-sm">{label}</span>
      </div>
      <strong className="font-heading text-3xl text-foreground">
        {value === null ? "—" : value.toLocaleString()}
      </strong>
    </Card>
  );
}

function DataCard({
  title,
  description,
  loading,
  error,
  onRetry,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div
            role="status"
            className="px-6 pb-6 text-sm text-muted-foreground"
          >
            Loading backend data…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 px-6 pb-6"
          >
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function JobRow({ job }: { job: AdminAcademicJob }) {
  return (
    <TableRow title={job.lastError ?? undefined}>
      <TableCell>
        <div className="max-w-64 whitespace-normal">
          <p className="font-medium text-foreground">{job.name}</p>
          <p className="text-xs text-muted-foreground">
            {humanize(job.dataType)}
          </p>
        </div>
      </TableCell>
      <TableCell>{humanize(job.source)}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          <StatusBadge status={job.status} />
          {job.schedulerStatus === "paused" && job.status !== "paused" ? (
            <Badge variant="secondary">Scheduler paused</Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        {job.progress ? (
          <div className="w-36 space-y-1">
            <Progress value={job.progress.percentage} />
            <p className="text-xs text-muted-foreground">
              {job.progress.current}/{job.progress.total} (
              {job.progress.percentage}%)
            </p>
          </div>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell>{formatDateTime(job.lastRunAt)}</TableCell>
      <TableCell>{formatDateTime(job.nextRunAt)}</TableCell>
    </TableRow>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant =
    normalized === "failed"
      ? "destructive"
      : normalized === "success" || normalized === "completed"
        ? "teal"
        : normalized === "paused" || normalized === "cancelled"
          ? "secondary"
          : "default";
  return <Badge variant={variant}>{humanize(status)}</Badge>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 pb-8 text-center text-muted-foreground">
      <TimerReset className="size-6" aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

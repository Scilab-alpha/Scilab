"use client";

import { useState } from "react";
import {
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { useAdminJobs } from "@/features/system-health/hooks/use-admin-sync";
import {
  pipelineJobLabel,
  type AdminPipelineJob,
} from "@/features/system-health/types/admin-sync.types";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";

function formatTimestamp(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function jobPaused(job: AdminPipelineJob) {
  return Boolean(job.paused ?? job.isPaused);
}

function jobRunning(job: AdminPipelineJob) {
  const status = String(job.status ?? job.state ?? job.lastStatus ?? "").toLowerCase();
  return status.includes("run") || (job.runningCount ?? 0) > 0;
}

function jobFailed(job: AdminPipelineJob) {
  const status = String(job.status ?? job.lastStatus ?? "").toLowerCase();
  return status.includes("fail") || (job.failedCount ?? 0) > 0;
}

function statusBadgeClass(job: AdminPipelineJob) {
  if (jobPaused(job)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (jobRunning(job)) return "bg-accent text-tag border-border";
  if (jobFailed(job)) return "bg-red-50 text-red-700 border-red-200";
  return "bg-teal/10 text-teal border-border";
}

function statusLabel(job: AdminPipelineJob) {
  if (jobPaused(job)) return "Paused";
  if (jobRunning(job)) return "Running";
  if (jobFailed(job)) return "Failed";
  return String(job.status ?? job.lastStatus ?? "Idle");
}

export default function AdminPipelineJobsPanel() {
  const { jobs, isLoading, error, reload, runAction, isMutating } =
    useAdminJobs();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const handleAction = async (
    jobId: string,
    action: "pause" | "resume" | "trigger" | "cancel" | "retry",
  ) => {
    const key = `${jobId}:${action}`;
    setPendingKey(key);
    try {
      await runAction(jobId, action);
      toast.success(`${pipelineJobLabel(jobId)} · ${action} accepted`);
    } catch (err) {
      toast.error(getUserFriendlyApiErrorMessage(err));
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Pipeline jobs
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pause, resume, trigger, cancel, or retry academic sync workers
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-card"
          disabled={isLoading || isMutating}
          onClick={() => void reload()}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="px-6 py-4 border-b border-border">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="p-6">
          <RouteDataLoading label="Loading pipeline jobs…" />
        </div>
      )}

      {!isLoading && !error && jobs.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground">
          No pipeline jobs returned by the API.
        </div>
      )}

      {!isLoading && jobs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Job
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Last run
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Queue
                </th>
                <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => {
                const id = String(job.id);
                const paused = jobPaused(job);
                const running = jobRunning(job);
                const failed = jobFailed(job);

                return (
                  <tr key={id} className="hover:bg-background/80">
                    <td className="py-3.5 px-6">
                      <p className="font-medium text-foreground">
                        {job.displayName || job.name || pipelineJobLabel(id)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {id}
                      </p>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium capitalize ${statusBadgeClass(job)}`}
                      >
                        {statusLabel(job)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-muted-foreground font-mono text-xs">
                      {formatTimestamp(job.lastRunAt)}
                    </td>
                    <td className="py-3.5 px-6 text-xs text-muted-foreground">
                      {job.runningCount != null || job.waitingCount != null
                        ? `run ${job.runningCount ?? 0} · wait ${job.waitingCount ?? 0}${
                            job.failedCount
                              ? ` · fail ${job.failedCount}`
                              : ""
                          }`
                        : "—"}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <ActionButton
                          label="Trigger"
                          icon={<Zap className="w-3.5 h-3.5" />}
                          disabled={isMutating}
                          pending={pendingKey === `${id}:trigger`}
                          onClick={() => void handleAction(id, "trigger")}
                        />
                        {paused ? (
                          <ActionButton
                            label="Resume"
                            icon={<Play className="w-3.5 h-3.5" />}
                            disabled={isMutating}
                            pending={pendingKey === `${id}:resume`}
                            onClick={() => void handleAction(id, "resume")}
                          />
                        ) : (
                          <ActionButton
                            label="Pause"
                            icon={<Pause className="w-3.5 h-3.5" />}
                            disabled={isMutating}
                            pending={pendingKey === `${id}:pause`}
                            onClick={() => void handleAction(id, "pause")}
                          />
                        )}
                        <ActionButton
                          label="Cancel"
                          icon={<Square className="w-3.5 h-3.5" />}
                          disabled={isMutating || !running}
                          pending={pendingKey === `${id}:cancel`}
                          onClick={() => void handleAction(id, "cancel")}
                        />
                        <ActionButton
                          label="Retry"
                          icon={<RotateCcw className="w-3.5 h-3.5" />}
                          disabled={isMutating || (!failed && !paused)}
                          pending={pendingKey === `${id}:retry`}
                          onClick={() => void handleAction(id, "retry")}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ActionButton({
  label,
  icon,
  disabled,
  pending,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  pending?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 px-2.5 bg-card"
      disabled={disabled || pending}
      onClick={onClick}
      title={label}
    >
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      <span className="sr-only sm:not-sr-only sm:inline">{label}</span>
    </Button>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react";
import {
  useAdminSyncLogDetail,
  useAdminSyncLogs,
} from "@/features/system-health/hooks/use-admin-sync";
import {
  ADMIN_SYNC_JOB_TYPES,
  ADMIN_SYNC_SOURCES,
  ADMIN_SYNC_STATUSES,
  syncJobTypeLabel,
  type AdminSyncJobType,
  type AdminSyncLogListParams,
  type AdminSyncSource,
  type AdminSyncStatus,
} from "@/features/system-health/types/admin-sync.types";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";

function formatTimestamp(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function statusClass(status: string) {
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "bg-teal/10 text-teal border-border";
    case "RUNNING":
      return "bg-accent text-tag border-border";
    case "PARTIAL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "FAILED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-surface-raised text-muted-foreground border-border";
  }
}

const selectClassName =
  "h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export default function AdminSyncLogsPanel() {
  const [filters, setFilters] = useState<AdminSyncLogListParams>({
    page: 1,
    pageSize: 10,
    source: "",
    dataType: "",
    status: "",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryFilters = useMemo(
    () => ({
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 10,
      source: filters.source || undefined,
      dataType: filters.dataType || undefined,
      status: filters.status || undefined,
      startedFrom: filters.startedFrom || undefined,
      startedTo: filters.startedTo || undefined,
    }),
    [filters],
  );

  const { items, page, isLoading, error, reload } =
    useAdminSyncLogs(queryFilters);
  const detail = useAdminSyncLogDetail(selectedId);

  const totalPages = Math.max(
    1,
    page?.totalPages ??
      Math.ceil((page?.total ?? 0) / Math.max(page?.pageSize ?? 20, 1)),
  );
  const currentPage = page?.page ?? filters.page ?? 1;

  const updateFilter = <K extends keyof AdminSyncLogListParams>(
    key: K,
    value: AdminSyncLogListParams[K],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? (value as number) : 1,
    }));
  };

  return (
    <>
      <Card className="border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Sync logs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filter academic pipeline runs by source, job type, and status
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-card self-start"
            disabled={isLoading}
            onClick={() => void reload()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        <div className="px-6 py-4 border-b border-border grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Source
            <select
              className={selectClassName}
              value={filters.source ?? ""}
              onChange={(event) =>
                updateFilter(
                  "source",
                  event.target.value as AdminSyncSource | "",
                )
              }
            >
              <option value="">All sources</option>
              {ADMIN_SYNC_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Job type
            <select
              className={selectClassName}
              value={filters.dataType ?? ""}
              onChange={(event) =>
                updateFilter(
                  "dataType",
                  event.target.value as AdminSyncJobType | "",
                )
              }
            >
              <option value="">All job types</option>
              {ADMIN_SYNC_JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {syncJobTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
            Status
            <select
              className={selectClassName}
              value={filters.status ?? ""}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value as AdminSyncStatus | "",
                )
              }
            >
              <option value="">All statuses</option>
              {ADMIN_SYNC_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full bg-card"
              onClick={() =>
                setFilters({
                  page: 1,
                  pageSize: 10,
                  source: "",
                  dataType: "",
                  status: "",
                })
              }
            >
              Clear filters
            </Button>
          </div>
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
            <RouteDataLoading label="Loading sync logs…" />
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            No sync logs match the current filters.
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Started
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Source
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Job
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Inserted
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Errors
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((log) => (
                    <tr key={log.id} className="hover:bg-background/80">
                      <td className="py-3.5 px-6 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(log.startedAt)}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-foreground">
                        {log.sourceName || log.source}
                      </td>
                      <td className="py-3.5 px-6 text-muted-foreground">
                        {syncJobTypeLabel(log.jobType)}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-medium ${statusClass(log.status)}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-semibold">
                        {(
                          log.insertedCount ??
                          log.totalInserted ??
                          0
                        ).toLocaleString("en-US")}
                      </td>
                      <td className="py-3.5 px-6 text-right font-semibold">
                        {(
                          log.updatedCount ??
                          log.totalUpdated ??
                          0
                        ).toLocaleString("en-US")}
                      </td>
                      <td className="py-3.5 px-6 text-right font-semibold">
                        {(
                          log.errorCount ??
                          log.totalErrors ??
                          0
                        ).toLocaleString("en-US")}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => setSelectedId(log.id)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
                {page?.total != null ? ` · ${page.total.toLocaleString("en-US")} logs` : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => updateFilter("page", currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => updateFilter("page", currentPage + 1)}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Sheet
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Sync log detail</SheetTitle>
            <SheetDescription>
              Full run metadata from GET /admin/sync-logs/:id
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4 px-1">
            {detail.isLoading && (
              <RouteDataLoading label="Loading sync log…" />
            )}
            {detail.error && (
              <p className="text-sm text-destructive">{detail.error}</p>
            )}
            {detail.log && (
              <dl className="space-y-3 text-sm">
                <DetailRow label="ID" value={detail.log.id} mono />
                <DetailRow
                  label="Source"
                  value={detail.log.sourceName || detail.log.source}
                />
                <DetailRow
                  label="Job type"
                  value={syncJobTypeLabel(detail.log.jobType)}
                />
                <DetailRow label="Status" value={detail.log.status} />
                <DetailRow
                  label="Started"
                  value={formatTimestamp(detail.log.startedAt)}
                />
                <DetailRow
                  label="Finished"
                  value={formatTimestamp(detail.log.finishedAt)}
                />
                <DetailRow
                  label="Fetched"
                  value={String(detail.log.totalFetched ?? 0)}
                />
                <DetailRow
                  label="Inserted"
                  value={String(
                    detail.log.insertedCount ?? detail.log.totalInserted ?? 0,
                  )}
                />
                <DetailRow
                  label="Updated"
                  value={String(
                    detail.log.updatedCount ?? detail.log.totalUpdated ?? 0,
                  )}
                />
                <DetailRow
                  label="Errors"
                  value={String(
                    detail.log.errorCount ?? detail.log.totalErrors ?? 0,
                  )}
                />
                {detail.log.configId && (
                  <DetailRow label="Config ID" value={detail.log.configId} mono />
                )}
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Error detail
                  </dt>
                  <dd className="rounded-md border border-border bg-background p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                    {detail.log.errorDetail?.trim() || "No error detail."}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </dt>
      <dd
        className={`text-right text-foreground ${mono ? "font-mono text-xs break-all" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

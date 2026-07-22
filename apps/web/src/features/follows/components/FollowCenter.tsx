"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, BookOpen, ExternalLink, Rss, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFollows } from "@/features/follows/hooks/use-follows";
import type {
  FollowItem,
  FollowObjectType,
  NotifyMode,
} from "@/features/follows/types/follow.types";
import PageContainer from "@/shared/components/layout/PageContainer";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import StudentTopHeader from "@/shared/components/layout/StudentTopHeader";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

const PAGE_LIMIT = 20;
const filters: Array<{ label: string; value?: FollowObjectType }> = [
  { label: "All" },
  { label: "Authors", value: "AUTHOR" },
  { label: "Journals", value: "JOURNAL" },
  { label: "Keywords", value: "KEYWORD" },
  { label: "Topics", value: "TOPIC" },
];
const notifyModes: Array<{ label: string; value: NotifyMode }> = [
  { label: "In app", value: "IN_APP" },
  { label: "Daily email", value: "DAILY_EMAIL" },
  { label: "Weekly email", value: "WEEKLY_EMAIL" },
  { label: "Off", value: "OFF" },
];

export default function FollowCenter() {
  const [type, setType] = useState<FollowObjectType | undefined>();
  const [page, setPage] = useState(1);
  const follows = useFollows({ type, page, limit: PAGE_LIMIT });

  const changeType = (nextType?: FollowObjectType) => {
    setType(nextType);
    setPage(1);
  };

  const remove = async (item: FollowItem) => {
    try {
      await follows.toggle({
        objectType: item.objectType,
        objectId: item.objectId,
        notifyMode: item.notifyMode,
      });
      toast.success("Follow removed.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not remove follow.",
      );
    }
  };

  const updateNotifyMode = async (item: FollowItem, notifyMode: NotifyMode) => {
    try {
      await follows.updateNotifyMode({
        objectType: item.objectType,
        objectId: item.objectId,
        notifyMode,
      });
      toast.success("Notification mode updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update notification mode.",
      );
    }
  };

  return (
    <>
      <StudentTopHeader searchPlaceholder="Search journals, articles, topics..." />
      <main className="flex-1 overflow-auto py-8">
        <PageContainer size="wide" className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl text-foreground">
                Following
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage followed research targets and notification delivery.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellRing className="size-4" aria-hidden="true" />
              Synced with your account
            </div>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filter follows">
            {filters.map((filter) => {
              const active = type === filter.value;
              return (
                <Button
                  key={filter.label}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  onClick={() => changeType(filter.value)}
                >
                  {filter.label}
                </Button>
              );
            })}
          </div>

          {follows.error ? (
            <Card className="border-border p-6">
              <p className="mb-4 text-sm text-destructive">{follows.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void follows.reload()}
              >
                Try again
              </Button>
            </Card>
          ) : null}

          {follows.isLoading ? (
            <RouteDataLoading label="Loading follows…" />
          ) : null}

          {!follows.isLoading &&
          !follows.error &&
          follows.items.length === 0 ? (
            <Card className="border-border p-12 text-center">
              <Rss className="mx-auto mb-4 size-9 text-muted-foreground" />
              <h2 className="font-heading text-lg text-foreground">
                No follows yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Follow journals from their detail pages or topics and keywords
                from Trend Analysis.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-5">
                <Link href="/student/journals">Browse journals</Link>
              </Button>
            </Card>
          ) : null}

          <div className="space-y-3">
            {follows.items.map((item) => (
              <FollowRow
                key={item.followId}
                item={item}
                removing={
                  follows.togglePending &&
                  follows.toggleVariables?.objectType === item.objectType &&
                  follows.toggleVariables.objectId === item.objectId
                }
                updating={
                  follows.notifyPending &&
                  follows.notifyVariables?.objectType === item.objectType &&
                  follows.notifyVariables.objectId === item.objectId
                }
                onRemove={() => void remove(item)}
                onNotifyModeChange={(mode) => void updateNotifyMode(item, mode)}
              />
            ))}
          </div>

          {!follows.isLoading && !follows.error && follows.data ? (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">Page {page}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || follows.isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!follows.data.hasMore || follows.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </PageContainer>
      </main>
    </>
  );
}

function FollowRow({
  item,
  onNotifyModeChange,
  onRemove,
  removing,
  updating,
}: {
  item: FollowItem;
  onNotifyModeChange: (mode: NotifyMode) => void;
  onRemove: () => void;
  removing: boolean;
  updating: boolean;
}) {
  const name = item.target.displayName?.trim() || item.objectId;
  return (
    <Card className="border-border p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {item.objectType === "JOURNAL" ? (
              <BookOpen className="size-5" aria-hidden="true" />
            ) : (
              <Rss className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-heading text-lg text-foreground">
                {name}
              </h2>
              <Badge variant="secondary">{formatType(item.objectType)}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Followed {formatDate(item.followedAt)} · ID: {item.objectId}
            </p>
            {item.target.country || item.target.region ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {[item.target.country, item.target.region]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`notify-${item.followId}`}>
            Notification mode for {name}
          </label>
          <select
            id={`notify-${item.followId}`}
            value={item.notifyMode}
            disabled={updating || removing}
            onChange={(event) =>
              onNotifyModeChange(event.target.value as NotifyMode)
            }
            className="h-9 rounded-[var(--radius-input)] border border-border bg-input-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {notifyModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>

          {item.objectType === "JOURNAL" ? (
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/student/journals/${encodeURIComponent(item.objectId)}`}
              >
                <ExternalLink className="size-4" />
                View
              </Link>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={removing || updating}
            onClick={onRemove}
            aria-label={`Unfollow ${name}`}
          >
            <Trash2 className="size-4" />
            {removing ? "Removing…" : "Unfollow"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function formatType(type: FollowObjectType) {
  return `${type.charAt(0)}${type.slice(1).toLowerCase()}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleDateString();
}

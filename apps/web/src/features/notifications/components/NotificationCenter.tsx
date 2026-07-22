"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  BookOpenCheck,
  Sparkles,
  FileCheck,
  Settings,
  UserRound,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { RouteDataLoading } from "@/shared/components/layout/RouteDataLoading";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import type {
  NotificationItem,
  NotificationObjectType,
} from "@/features/notifications/types/notification.types";

type UiCategory =
  | "all"
  | "author"
  | "journal"
  | "topic"
  | "publication"
  | "system";

function toUiCategory(
  type: NotificationObjectType | null,
): Exclude<UiCategory, "all"> {
  switch (type) {
    case "AUTHOR":
      return "author";
    case "JOURNAL":
      return "journal";
    case "TOPIC":
    case "KEYWORD":
      return "topic";
    case "ARTICLE":
      return "publication";
    default:
      return "system";
  }
}

function getRelatedHref(item: NotificationItem) {
  if (!item.relatedObjectId || !item.relatedObjectType) {
    return null;
  }

  if (item.relatedObjectType === "ARTICLE") {
    return `/student/articles/${item.relatedObjectId}`;
  }

  if (item.relatedObjectType === "JOURNAL") {
    return `/student/journals/${item.relatedObjectId}`;
  }

  return null;
}

function formatTimeAgo(timestamp: string) {
  const diffInMinutes = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 60_000,
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function NotificationCenter() {
  const [selectedCategory, setSelectedCategory] = useState<UiCategory>("all");
  const [page, setPage] = useState(1);
  const {
    items,
    hasMore,
    unreadCount,
    isLoading,
    error,
    reload,
    markRead,
    markAllRead,
  } = useNotifications(page, 20);

  const categories = [
    { id: "all" as const, label: "All", icon: Bell },
    { id: "author" as const, label: "Authors", icon: UserRound },
    { id: "journal" as const, label: "Journals", icon: BookOpenCheck },
    { id: "topic" as const, label: "Topics", icon: Sparkles },
    { id: "publication" as const, label: "Articles", icon: FileCheck },
    { id: "system" as const, label: "System", icon: Settings },
  ];

  const filtered = useMemo(() => {
    if (selectedCategory === "all") {
      return items;
    }

    return items.filter(
      (item) => toUiCategory(item.relatedObjectType) === selectedCategory,
    );
  }, [items, selectedCategory]);

  return (
    <>
      <header className="h-16 bg-card border-b border-border px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary/15 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-lg text-foreground">
              Notifications
            </h1>
            <p className="text-xs text-muted-foreground">
              Alerts for followed authors, journals, topics, and keywords
              {unreadCount !== null && unreadCount > 0
                ? ` · ${unreadCount} unread`
                : ""}
            </p>
          </div>
        </div>

        <Link
          href="/student/profile"
          className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center"
        >
          <span className="text-sm font-medium text-tag">ME</span>
        </Link>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-card text-muted-foreground hover:bg-accent border border-border"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {unreadCount !== null && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => void markAllRead()}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>

          {error && (
            <Card className="p-6 border-border">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void reload()}>
                Try again
              </Button>
            </Card>
          )}

          {isLoading && <RouteDataLoading label="Loading notifications…" />}

          {!isLoading && !error && filtered.length === 0 && (
            <Card className="p-12 border-border text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-lg text-foreground mb-2">
                {selectedCategory === "all"
                  ? "No notifications on this page"
                  : "No matching notifications on this page"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Notifications alert you when new articles match journals,
                topics, or keywords you follow.
              </p>
              {selectedCategory === "all" && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/student/journals">Follow a journal</Link>
                </Button>
              )}
            </Card>
          )}

          <div className="space-y-2">
            {filtered.map((item) => {
              const category = toUiCategory(item.relatedObjectType);
              const href = getRelatedHref(item);

              return (
                <Card
                  key={item.notificationId}
                  className={`p-4 border-border ${item.isRead ? "opacity-80" : "bg-accent/20"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          {category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm font-medium leading-snug text-foreground mb-1">
                        {item.title}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.message}
                      </p>
                      {href && (
                        <Link
                          href={href}
                          className="inline-block mt-2 text-sm text-primary hover:underline"
                        >
                          Open related item
                        </Link>
                      )}
                    </div>

                    {!item.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void markRead(item.notificationId)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {!isLoading && !error && items.length > 0 ? (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Backend page {page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

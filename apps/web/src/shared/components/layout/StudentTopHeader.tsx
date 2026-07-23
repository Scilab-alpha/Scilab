"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { ROLE_LABELS } from "@/shared/constants/permissions";
import { useAuth } from "@/providers/auth-provider";
import Can from "@/shared/components/auth/Can";
import { getUnreadNotificationCount } from "@/features/notifications/api/notifications.api";
import { NOTIFICATION_UNREAD_EVENT } from "@/features/notifications/lib/notification-popup";

interface StudentTopHeaderProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function StudentTopHeader({
  searchPlaceholder = "Search journals, articles, topics...",
  searchValue,
  onSearchChange,
}: StudentTopHeaderProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void getUnreadNotificationCount()
      .then((result) => {
        if (!cancelled) {
          setUnreadCount(result.unreadCount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnreadCount(0);
        }
      });

    const onUnread = (event: Event) => {
      const delta = (event as CustomEvent<{ delta?: number }>).detail?.delta;
      if (typeof delta === "number" && delta !== 0) {
        setUnreadCount((previous) => Math.max(0, previous + delta));
      } else {
        void getUnreadNotificationCount()
          .then((result) => setUnreadCount(result.unreadCount))
          .catch(() => undefined);
      }
    };

    window.addEventListener(NOTIFICATION_UNREAD_EVENT, onUnread);

    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATION_UNREAD_EVENT, onUnread);
    };
  }, [user?.id]);

  return (
    <header className="h-16 shrink-0 bg-card border-b border-border px-8 flex items-center justify-between gap-4">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            className="pl-10 h-10 bg-background"
            value={searchValue ?? ""}
            readOnly={!onSearchChange}
            onChange={
              onSearchChange
                ? (event) => onSearchChange(event.target.value)
                : undefined
            }
            aria-label={searchPlaceholder}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-[var(--radius-button)] bg-accent text-xs font-medium text-tag">
          {user ? ROLE_LABELS[user.role] : "Guest"}
        </span>

        <Can permission="notifications">
          <Link
            href="/student/notifications"
            className="relative p-2 hover:bg-accent rounded-[var(--radius-button)] transition-colors"
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
          >
            <Bell
              className="w-5 h-5 text-muted-foreground"
              strokeWidth={1.75}
            />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            )}
          </Link>
        </Can>

        {user ? (
          <Can permission="profile">
            <Link
              href="/student/profile"
              className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center"
            >
              <span className="text-sm font-medium text-tag">
                {user.initials}
              </span>
            </Link>
          </Can>
        ) : (
          <Link
            href="/auth/login"
            className="text-sm font-medium text-tag hover:underline"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

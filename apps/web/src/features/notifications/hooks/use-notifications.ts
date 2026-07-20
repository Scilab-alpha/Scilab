"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api/notifications.api";
import { NOTIFICATION_UNREAD_EVENT } from "@/features/notifications/lib/notification-popup";
import type { NotificationItem } from "@/features/notifications/types/notification.types";

const notificationsQueryKey = [
  "notifications",
  { page: 1, limit: 50 },
] as const;

function emitUnreadDelta(delta: number) {
  if (typeof window === "undefined" || delta === 0) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_UNREAD_EVENT, {
      detail: { delta },
    }),
  );
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: notificationsQueryKey,
    staleTime: listQueryStaleTimeMs,
    queryFn: () => listNotifications({ page: 1, limit: 50 }),
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  const reload = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const markRead = useCallback(
    async (notificationId: string) => {
      const previous = items.find(
        (item) => item.notificationId === notificationId,
      );
      const updated = await markNotificationRead(notificationId);

      queryClient.setQueryData(
        notificationsQueryKey,
        (old: { items: NotificationItem[] } | undefined) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            items: old.items.map((item) =>
              item.notificationId === notificationId ? updated : item,
            ),
          };
        },
      );

      if (previous && !previous.isRead && updated.isRead) {
        emitUnreadDelta(-1);
      }
    },
    [items, queryClient],
  );

  const markAllRead = useCallback(async () => {
    const unreadBefore = items.filter((item) => !item.isRead).length;
    await markAllNotificationsRead();
    const readAt = new Date().toISOString();

    queryClient.setQueryData(
      notificationsQueryKey,
      (old: { items: NotificationItem[] } | undefined) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          items: old.items.map((item) => ({
            ...item,
            isRead: true,
            readAt: item.readAt ?? readAt,
          })),
        };
      },
    );

    if (unreadBefore > 0) {
      emitUnreadDelta(-unreadBefore);
    }
  }, [items, queryClient]);

  return {
    items,
    isLoading: query.isLoading,
    error: query.error ? getUserFriendlyApiErrorMessage(query.error) : null,
    reload,
    markRead,
    markAllRead,
  };
}

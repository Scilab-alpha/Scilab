"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listQueryStaleTimeMs } from "@/core/api/query-config";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api/notifications.api";
import { NOTIFICATION_UNREAD_EVENT } from "@/features/notifications/lib/notification-popup";
import type { NotificationListResponse } from "@/features/notifications/types/notification.types";

export const NOTIFICATION_QUERY_KEY = ["notifications"] as const;
export const NOTIFICATION_UNREAD_QUERY_KEY = [
  ...NOTIFICATION_QUERY_KEY,
  "unread-count",
] as const;

export function notificationListQueryKey(page: number, limit: number) {
  return [...NOTIFICATION_QUERY_KEY, "list", { page, limit }] as const;
}

function emitUnreadDelta(delta: number) {
  if (typeof window === "undefined" || delta === 0) return;
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_UNREAD_EVENT, { detail: { delta } }),
  );
}

export function useNotifications(page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const queryKey = notificationListQueryKey(page, limit);

  const query = useQuery({
    queryKey,
    staleTime: listQueryStaleTimeMs,
    queryFn: () => listNotifications({ page, limit }),
  });
  const unreadQuery = useQuery({
    queryKey: NOTIFICATION_UNREAD_QUERY_KEY,
    staleTime: listQueryStaleTimeMs,
    queryFn: getUnreadNotificationCount,
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  const reload = useCallback(async () => {
    setActionError(null);
    await Promise.all([query.refetch(), unreadQuery.refetch()]);
  }, [query, unreadQuery]);

  const markRead = useCallback(
    async (notificationId: string) => {
      setActionError(null);
      try {
        const previous = items.find(
          (item) => item.notificationId === notificationId,
        );
        const updated = await markNotificationRead(notificationId);

        queryClient.setQueryData<NotificationListResponse>(queryKey, (old) =>
          old
            ? {
                ...old,
                items: old.items.map((item) =>
                  item.notificationId === notificationId ? updated : item,
                ),
              }
            : old,
        );
        await queryClient.invalidateQueries({
          queryKey: NOTIFICATION_UNREAD_QUERY_KEY,
          refetchType: "active",
        });

        if (previous && !previous.isRead && updated.isRead) {
          emitUnreadDelta(-1);
        }
      } catch (error) {
        setActionError(getUserFriendlyApiErrorMessage(error));
      }
    },
    [items, queryClient, queryKey],
  );

  const markAllRead = useCallback(async () => {
    setActionError(null);
    try {
      const result = await markAllNotificationsRead();
      await queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEY,
        refetchType: "active",
      });
      emitUnreadDelta(-result.updatedCount);
    } catch (error) {
      setActionError(getUserFriendlyApiErrorMessage(error));
    }
  }, [queryClient]);

  return {
    items,
    page: query.data?.page ?? page,
    hasMore: query.data?.hasMore ?? false,
    unreadCount: unreadQuery.data?.unreadCount ?? null,
    isLoading: query.isLoading,
    error: query.error
      ? getUserFriendlyApiErrorMessage(query.error)
      : unreadQuery.error
        ? getUserFriendlyApiErrorMessage(unreadQuery.error)
        : actionError,
    reload,
    markRead,
    markAllRead,
  };
}

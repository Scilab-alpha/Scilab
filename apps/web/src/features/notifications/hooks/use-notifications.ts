"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api/notifications.api";
import type { NotificationItem } from "@/features/notifications/types/notification.types";

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await listNotifications({ page: 1, limit: 50 });
      setItems(page.items);
    } catch (fetchError) {
      setItems([]);
      setError(getUserFriendlyApiErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const markRead = useCallback(async (notificationId: string) => {
    const updated = await markNotificationRead(notificationId);
    setItems((prev) =>
      prev.map((item) =>
        item.notificationId === notificationId ? updated : item,
      ),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
  }, []);

  return {
    items,
    isLoading,
    error,
    reload,
    markRead,
    markAllRead,
  };
}

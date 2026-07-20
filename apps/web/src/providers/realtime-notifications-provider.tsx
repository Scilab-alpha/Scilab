"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import type { NotificationItem } from "@/features/notifications/types/notification.types";
import {
  NOTIFICATION_POPUP_EVENT,
  NOTIFICATION_UNREAD_EVENT,
  type NotificationPopupDetail,
} from "@/features/notifications/lib/notification-popup";

type UserEventPayload = {
  eventId: string;
  occurredAt: string;
  type: string;
  data: unknown;
};

function asNotificationItem(data: unknown): NotificationItem | null {
  let candidate = data;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return null;
    }
  }
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  // Nest wraps as UserEventPayload; also accept bare notification payloads.
  const wrapped = candidate as Partial<UserEventPayload> &
    Partial<NotificationItem>;
  const item =
    wrapped.data && typeof wrapped.data === "object"
      ? (wrapped.data as Partial<NotificationItem>)
      : wrapped;

  if (
    typeof item.notificationId !== "string" ||
    typeof item.title !== "string" ||
    typeof item.message !== "string"
  ) {
    return null;
  }

  return {
    notificationId: item.notificationId,
    title: item.title,
    message: item.message,
    relatedObjectType: item.relatedObjectType ?? null,
    relatedObjectId: item.relatedObjectId ?? null,
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt ?? new Date().toISOString(),
    readAt: item.readAt ?? null,
  };
}

function getNotificationHref(item: NotificationItem) {
  if (item.relatedObjectType === "ARTICLE" && item.relatedObjectId) {
    return `/student/articles/${item.relatedObjectId}`;
  }
  if (item.relatedObjectType === "JOURNAL" && item.relatedObjectId) {
    return `/student/journals/${item.relatedObjectId}`;
  }
  return "/student/notifications";
}

function showNotificationToast(item: NotificationItem) {
  toast(item.title, {
    description: item.message,
    duration: 8_000,
    action: {
      label: "Open",
      onClick: () => {
        window.location.href = getNotificationHref(item);
      },
    },
  });
}

/**
 * Subscribes to server SSE `/api/events` and shows an immediate toast popup
 * when `notification.created` arrives. Also listens for local popup events.
 */
export function RealtimeNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onPopup = (event: Event) => {
      const detail = (event as CustomEvent<NotificationPopupDetail>).detail;
      if (!detail?.notification) {
        return;
      }
      showNotificationToast(detail.notification);
    };

    window.addEventListener(NOTIFICATION_POPUP_EVENT, onPopup);
    return () => window.removeEventListener(NOTIFICATION_POPUP_EVENT, onPopup);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let source: EventSource | null = null;
    let closed = false;
    let retryTimer: number | undefined;

    const connect = () => {
      if (closed) {
        return;
      }

      source = new EventSource("/api/events");

      source.addEventListener("notification.created", (event) => {
        try {
          const raw = (event as MessageEvent).data as string;
          const parsed = JSON.parse(raw) as unknown;
          const notification = asNotificationItem(parsed);
          if (!notification) {
            return;
          }
          showNotificationToast(notification);
          window.dispatchEvent(
            new CustomEvent(NOTIFICATION_UNREAD_EVENT, {
              detail: { delta: 1 },
            }),
          );
        } catch {
          // Ignore malformed SSE payloads.
        }
      });

      source.onerror = () => {
        source?.close();
        source = null;
        if (!closed) {
          retryTimer = window.setTimeout(connect, 5_000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      source?.close();
    };
  }, [isAuthenticated]);

  return children;
}

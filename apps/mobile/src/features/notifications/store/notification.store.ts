import { create } from "zustand";

import type {
  NotificationConnectionStatus,
  NotificationItem,
  NotificationItemKind,
  UserEventPayload,
  UserEventType,
} from "@/features/notifications/types/notification.type";

const maxNotifications = 50;

type NotificationState = {
  connectionStatus: NotificationConnectionStatus;
  lastError: string | null;
  markAllNotificationsRead: () => void;
  markNotificationRead: (notificationId: string) => void;
  notifications: NotificationItem[];
  receiveUserEvent: (event: UserEventPayload) => void;
  resetNotifications: () => void;
  setConnectionError: (message: string) => void;
  setConnectionStatus: (status: NotificationConnectionStatus) => void;
  unreadCount: number;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  connectionStatus: "idle",
  lastError: null,
  markAllNotificationsRead: () => {
    set((state) =>
      withUnreadCount({
        ...state,
        notifications: state.notifications.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      }),
    );
  },
  markNotificationRead: (notificationId) => {
    set((state) =>
      withUnreadCount({
        ...state,
        notifications: state.notifications.map((item) =>
          item.id === notificationId || item.eventId === notificationId
            ? {
                ...item,
                isRead: true,
                readAt: item.readAt ?? new Date().toISOString(),
              }
            : item,
        ),
      }),
    );
  },
  notifications: [],
  receiveUserEvent: (event) => {
    if (event.type === "ping") {
      return;
    }

    if (event.type === "notification.read") {
      const notificationId = getNotificationId(event.data);
      if (!notificationId) {
        return;
      }

      set((state) =>
        withUnreadCount({
          ...state,
          notifications: state.notifications.map((item) =>
            item.id === notificationId || item.eventId === notificationId
              ? {
                  ...item,
                  isRead: true,
                  readAt: item.readAt ?? event.occurredAt,
                }
              : item,
          ),
        }),
      );
      return;
    }

    if (event.type === "notification.read_all") {
      set((state) =>
        withUnreadCount({
          ...state,
          notifications: state.notifications.map((item) => ({
            ...item,
            isRead: true,
            readAt: item.readAt ?? event.occurredAt,
          })),
        }),
      );
      return;
    }

    const notification = toNotificationItem(event);
    if (!notification) {
      return;
    }

    set((state) =>
      withUnreadCount({
        ...state,
        notifications: [
          notification,
          ...state.notifications.filter(
            (item) =>
              item.eventId !== notification.eventId &&
              item.id !== notification.id,
          ),
        ].slice(0, maxNotifications),
      }),
    );
  },
  resetNotifications: () =>
    set({
      connectionStatus: "idle",
      lastError: null,
      notifications: [],
      unreadCount: 0,
    }),
  setConnectionError: (message) =>
    set({ connectionStatus: "error", lastError: message }),
  setConnectionStatus: (status) =>
    set({
      connectionStatus: status,
      lastError: null,
    }),
  unreadCount: 0,
}));

function withUnreadCount<TState extends Pick<NotificationState, "notifications">>(
  state: TState,
) {
  return {
    ...state,
    unreadCount: state.notifications.filter((item) => !item.isRead).length,
  };
}

function toNotificationItem(event: UserEventPayload): NotificationItem | null {
  const data = toRecord(event.data);
  const id = getNotificationId(data) ?? event.eventId;
  const kind = getNotificationKind(event.type);

  return {
    eventId: event.eventId,
    id,
    isRead: getBoolean(data.isRead) ?? false,
    kind,
    message:
      getString(data.message) ??
      getString(data.body) ??
      getString(data.description) ??
      getDefaultMessage(event.type),
    occurredAt:
      getString(data.createdAt) ??
      getString(data.occurredAt) ??
      event.occurredAt,
    readAt: getString(data.readAt),
    relatedObjectId:
      getString(data.relatedObjectId) ?? getString(data.objectId),
    relatedObjectType:
      getString(data.relatedObjectType) ?? getString(data.objectType),
    title: getString(data.title) ?? getDefaultTitle(event.type),
    type: event.type,
  };
}

function getNotificationKind(type: UserEventType): NotificationItemKind {
  if (type.startsWith("bookmark.")) {
    return "bookmark";
  }

  if (type.startsWith("follow.")) {
    return "follow";
  }

  return "notification";
}

function getNotificationId(data: unknown) {
  const record = toRecord(data);
  return (
    getString(record.id) ??
    getString(record.notificationId) ??
    getString(record.eventId)
  );
}

function getDefaultTitle(type: UserEventType) {
  switch (type) {
    case "bookmark.toggled":
      return "Bookmark updated";
    case "follow.toggled":
    case "follow.updated":
      return "Follow updated";
    default:
      return "New notification";
  }
}

function getDefaultMessage(type: UserEventType) {
  switch (type) {
    case "bookmark.toggled":
      return "Your saved research list has changed.";
    case "follow.toggled":
    case "follow.updated":
      return "A followed topic, keyword, or journal was updated.";
    default:
      return "A new ScholarTrend update is available.";
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

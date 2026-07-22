export type UserEventType =
  | "notification.created"
  | "notification.read"
  | "notification.read_all"
  | "bookmark.toggled"
  | "follow.toggled"
  | "follow.updated"
  | "ping";

export type UserEventPayload<TData = unknown> = {
  data: TData;
  eventId: string;
  occurredAt: string;
  type: UserEventType;
};

export type NotificationConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error";

export type NotificationItemKind = "notification" | "bookmark" | "follow";

export type NotificationItem = {
  eventId: string;
  id: string;
  isRead: boolean;
  kind: NotificationItemKind;
  message: string;
  occurredAt: string;
  readAt: string | null;
  relatedObjectId: string | null;
  relatedObjectType: string | null;
  title: string;
  type: UserEventType;
};

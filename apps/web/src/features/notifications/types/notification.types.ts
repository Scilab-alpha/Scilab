import type { PageParams, PageResult } from "@/core/api/pagination";

export type NotificationObjectType =
  | "ARTICLE"
  | "JOURNAL"
  | "KEYWORD"
  | "TOPIC";

/** Item from GET /notifications */
export type NotificationItem = {
  notificationId: string;
  title: string;
  message: string;
  relatedObjectType: NotificationObjectType | null;
  relatedObjectId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

export type NotificationListParams = PageParams & {
  isRead?: boolean;
};

export type NotificationListResponse = PageResult<NotificationItem>;

export type UnreadCountResponse = {
  unreadCount: number;
};

export type MarkAllReadResponse = {
  updatedCount: number;
};

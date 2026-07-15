import { apiRequest } from "@/core/api";
import type {
  MarkAllReadResponse,
  NotificationItem,
  NotificationListParams,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/features/notifications/types/notification.types";

const defaultLimit = 20;

function buildQuery(params: NotificationListParams = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? defaultLimit),
  });

  if (typeof params.isRead === "boolean") {
    query.set("isRead", String(params.isRead));
  }

  return query.toString();
}

/** GET /notifications */
export function listNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResponse> {
  return apiRequest<NotificationListResponse>({
    authenticated: true,
    method: "GET",
    path: `/notifications?${buildQuery(params)}`,
  });
}

/** GET /notifications/unread-count */
export function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  return apiRequest<UnreadCountResponse>({
    authenticated: true,
    method: "GET",
    path: "/notifications/unread-count",
  });
}

/** PATCH /notifications/:id/read */
export function markNotificationRead(
  notificationId: string,
): Promise<NotificationItem> {
  return apiRequest<NotificationItem>({
    authenticated: true,
    method: "PATCH",
    path: `/notifications/${encodeURIComponent(notificationId)}/read`,
  });
}

/** PATCH /notifications/read-all */
export function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
  return apiRequest<MarkAllReadResponse>({
    authenticated: true,
    method: "PATCH",
    path: "/notifications/read-all",
  });
}

import { apiRequest } from "@/core/api";
import {
  getLocalUnreadCount,
  listLocalNotifications,
  markAllLocalNotificationsRead,
  markLocalNotificationRead,
} from "@/features/notifications/api/local-notifications";
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

async function listServerNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResponse> {
  try {
    return await apiRequest<NotificationListResponse>({
      authenticated: true,
      method: "GET",
      path: `/notifications?${buildQuery(params)}`,
    });
  } catch {
    return {
      items: [],
      page: params.page ?? 1,
      limit: params.limit ?? defaultLimit,
      hasMore: false,
    };
  }
}

/** GET /notifications (+ local follow alerts for OpenAlex catalog). */
export async function listNotifications(
  params: NotificationListParams = {},
): Promise<NotificationListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? defaultLimit;
  const [server, local] = await Promise.all([
    listServerNotifications(params),
    Promise.resolve(listLocalNotifications()),
  ]);

  const filteredLocal =
    typeof params.isRead === "boolean"
      ? local.filter((item) => item.isRead === params.isRead)
      : local;

  const seen = new Set(server.items.map((item) => item.notificationId));
  const merged = [
    ...server.items,
    ...filteredLocal.filter((item) => !seen.has(item.notificationId)),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const start = (page - 1) * limit;
  return {
    items: merged.slice(start, start + limit),
    page,
    limit,
    hasMore: start + limit < merged.length || server.hasMore,
  };
}

/** GET /notifications/unread-count */
export async function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  let serverCount = 0;
  try {
    const server = await apiRequest<UnreadCountResponse>({
      authenticated: true,
      method: "GET",
      path: "/notifications/unread-count",
    });
    serverCount = server.unreadCount;
  } catch {
    serverCount = 0;
  }

  return { unreadCount: serverCount + getLocalUnreadCount() };
}

/** PATCH /notifications/:id/read */
export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationItem> {
  if (notificationId.startsWith("local-")) {
    const local = markLocalNotificationRead(notificationId);
    if (!local) {
      throw new Error("Notification not found.");
    }
    return local;
  }

  return apiRequest<NotificationItem>({
    authenticated: true,
    method: "PATCH",
    path: `/notifications/${encodeURIComponent(notificationId)}/read`,
  });
}

/** PATCH /notifications/read-all */
export async function markAllNotificationsRead(): Promise<MarkAllReadResponse> {
  const local = markAllLocalNotificationsRead();
  try {
    const server = await apiRequest<MarkAllReadResponse>({
      authenticated: true,
      method: "PATCH",
      path: "/notifications/read-all",
    });
    return {
      updatedCount: server.updatedCount + local.updatedCount,
    };
  } catch {
    return local;
  }
}

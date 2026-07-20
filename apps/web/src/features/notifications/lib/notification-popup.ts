import type { NotificationItem } from "@/features/notifications/types/notification.types";

export const NOTIFICATION_POPUP_EVENT = "scilab:notification-popup";
export const NOTIFICATION_UNREAD_EVENT = "scilab:notification-unread";

export type NotificationPopupDetail = {
  notification: NotificationItem;
  source: "server" | "local";
};

export function publishNotificationPopup(
  notification: NotificationItem,
  source: "server" | "local" = "local",
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<NotificationPopupDetail>(NOTIFICATION_POPUP_EVENT, {
      detail: { notification, source },
    }),
  );
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_UNREAD_EVENT, {
      detail: { delta: notification.isRead ? 0 : 1 },
    }),
  );
}

export type NotificationCategory = "journal" | "topic" | "publication" | "system";

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  relatedId?: string;
}

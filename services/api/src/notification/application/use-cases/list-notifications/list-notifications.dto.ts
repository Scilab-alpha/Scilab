import { NotificationObjectType } from '@/notification/application/ports/notification.ports';

export interface ListNotificationsInput {
  userId: string;
  page?: unknown;
  limit?: unknown;
  isRead?: unknown;
}

export interface NotificationOutput {
  notificationId: string;
  title: string;
  message: string;
  relatedObjectType: NotificationObjectType | null;
  relatedObjectId: string | null;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
}

export interface ListNotificationsOutput {
  items: NotificationOutput[];
  page: number;
  limit: number;
  hasMore: boolean;
}

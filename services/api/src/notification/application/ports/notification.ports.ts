export type NotificationObjectType =
  | 'ARTICLE'
  | 'JOURNAL'
  | 'KEYWORD'
  | 'TOPIC';

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  relatedObjectType: NotificationObjectType | null;
  relatedObjectId: string | null;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  relatedObjectType?: NotificationObjectType | null;
  relatedObjectId?: string | null;
}

export interface NotificationRepository {
  listByUser(input: {
    userId: string;
    isRead?: boolean;
    skip: number;
    take: number;
  }): Promise<NotificationRecord[]>;
  countUnread(userId: string): Promise<number>;
  markRead(
    userId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<NotificationRecord | null>;
  markAllRead(userId: string, readAt: Date): Promise<number>;
  create(input: CreateNotificationInput): Promise<NotificationRecord>;
  createForArticleIfNotExists(input: {
    userId: string;
    articleId: string;
    title: string;
    message: string;
  }): Promise<NotificationRecord | null>;
}

export interface EmailDigestMessage {
  userId: string;
  subject: string;
  body: string;
}

export interface EmailDigestPort {
  send(message: EmailDigestMessage): Promise<void>;
}

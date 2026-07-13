import { NotificationOutput } from '@/notification/application/use-cases/list-notifications/list-notifications.dto';

export interface MarkNotificationReadInput {
  userId: string;
  notificationId: unknown;
}

export type MarkNotificationReadOutput = NotificationOutput;

export type UserEventType =
  | 'notification.created'
  | 'notification.read'
  | 'notification.read_all'
  | 'bookmark.toggled'
  | 'follow.toggled'
  | 'follow.updated'
  | 'ping';

export interface UserEventPayload<TData = unknown> {
  eventId: string;
  occurredAt: string;
  type: UserEventType;
  data: TData;
}

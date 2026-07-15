export enum NotificationFailureReason {
  InvalidInput = 'INVALID_INPUT',
  NotificationMissing = 'NOTIFICATION_MISSING',
}

export class NotificationUseCaseError extends Error {
  constructor(
    readonly reason: NotificationFailureReason,
    message = 'Notification request failed',
  ) {
    super(message);
  }
}

import type { MessageEvent } from '@nestjs/common';
import type { UserEventPayload } from '@/events/application/user-event.types';
import { UserEventsService } from '@/events/application/user-events.service';

describe('UserEventsService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('subscribes per user, emits only to the target user, and sends pings', () => {
    const service = new UserEventsService();
    const userMessages: MessageEvent[] = [];
    const otherMessages: MessageEvent[] = [];

    const userSubscription = service
      .subscribe('user-1')
      .subscribe((message) => userMessages.push(message));
    const otherSubscription = service
      .subscribe('user-2')
      .subscribe((message) => otherMessages.push(message));

    const firstPing = userMessages[0].data as UserEventPayload<
      Record<string, never>
    >;
    expect(userMessages[0].type).toBe('ping');
    expect(firstPing).toMatchObject({ type: 'ping', data: {} });
    expect(otherMessages[0]).toMatchObject({ type: 'ping' });

    service.emit('user-1', 'notification.created', {
      notificationId: 'notification-1',
    });

    expect(userMessages).toHaveLength(2);
    const createdPayload = userMessages[1].data as UserEventPayload<{
      notificationId: string;
    }>;
    expect(userMessages[1].type).toBe('notification.created');
    expect(createdPayload).toMatchObject({
      type: 'notification.created',
      data: { notificationId: 'notification-1' },
    });
    expect(otherMessages).toHaveLength(1);

    jest.advanceTimersByTime(25_000);
    expect(userMessages.at(-1)).toMatchObject({ type: 'ping' });
    expect(otherMessages.at(-1)).toMatchObject({ type: 'ping' });

    userSubscription.unsubscribe();
    otherSubscription.unsubscribe();
  });
});

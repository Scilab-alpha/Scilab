import { Injectable, MessageEvent } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, Subscriber } from 'rxjs';
import {
  UserEventPayload,
  UserEventType,
} from '@/events/application/user-event.types';

const PING_INTERVAL_MS = 25_000;

@Injectable()
export class UserEventsService {
  private readonly subscribers = new Map<
    string,
    Set<Subscriber<MessageEvent>>
  >();

  subscribe(userId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      this.addSubscriber(userId, subscriber);
      subscriber.next(this.toMessage('ping', {}));

      const pingTimer = setInterval(() => {
        subscriber.next(this.toMessage('ping', {}));
      }, PING_INTERVAL_MS);

      return () => {
        clearInterval(pingTimer);
        this.removeSubscriber(userId, subscriber);
      };
    });
  }

  emit<TData>(userId: string, type: UserEventType, data: TData): void {
    const message = this.toMessage(type, data);
    for (const subscriber of this.subscribers.get(userId) ?? []) {
      subscriber.next(message);
    }
  }

  private addSubscriber(
    userId: string,
    subscriber: Subscriber<MessageEvent>,
  ): void {
    const currentSubscribers = this.subscribers.get(userId) ?? new Set();
    currentSubscribers.add(subscriber);
    this.subscribers.set(userId, currentSubscribers);
  }

  private removeSubscriber(
    userId: string,
    subscriber: Subscriber<MessageEvent>,
  ): void {
    const currentSubscribers = this.subscribers.get(userId);
    if (!currentSubscribers) {
      return;
    }

    currentSubscribers.delete(subscriber);
    if (currentSubscribers.size === 0) {
      this.subscribers.delete(userId);
    }
  }

  private toMessage<TData>(type: UserEventType, data: TData): MessageEvent {
    const payload: UserEventPayload<TData> = {
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
      type,
      data,
    };

    return {
      id: payload.eventId,
      type,
      data: payload,
    };
  }
}

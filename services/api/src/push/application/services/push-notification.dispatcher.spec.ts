/* eslint-disable @typescript-eslint/unbound-method */
import { PushDeviceRecord } from '@/push/application/ports/push.ports';
import { PushNotificationDispatcher } from '@/push/application/services/push-notification.dispatcher';
import { ExpoPushAdapter } from '@/push/infrastructure/delivery/expo-push.adapter';
import { FcmPushAdapter } from '@/push/infrastructure/delivery/fcm-push.adapter';
import { PrismaPushDeviceRepository } from '@/push/infrastructure/persistence/prisma-push-device.repository';

const userId = '11111111-1111-4111-8111-111111111111';
const now = new Date('2026-06-01T00:00:00.000Z');

function device(
  id: string,
  provider: PushDeviceRecord['provider'],
): PushDeviceRecord {
  return {
    id,
    userId,
    provider,
    token: `${provider.toLowerCase()}-${id}`,
    platform: 'IOS',
    clientDeviceId: null,
    isActive: true,
    lastRegisteredAt: now,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe('PushNotificationDispatcher', () => {
  it('sends with provider adapters and deactivates invalid tokens', async () => {
    const devices = {
      listActiveByUser: jest
        .fn()
        .mockResolvedValue([device('expo-1', 'EXPO'), device('fcm-1', 'FCM')]),
      deactivate: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<PrismaPushDeviceRepository>;
    const expo = {
      send: jest.fn().mockResolvedValue({ invalidDeviceIds: ['expo-1'] }),
    } as unknown as jest.Mocked<ExpoPushAdapter>;
    const fcm = {
      send: jest.fn().mockResolvedValue({ invalidDeviceIds: [] }),
    } as unknown as jest.Mocked<FcmPushAdapter>;

    await new PushNotificationDispatcher(devices, expo, fcm).sendToUser(
      userId,
      {
        title: 'New article',
        body: 'Article title',
        data: { notificationId: 'notification-1' },
      },
    );

    expect(expo.send).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'expo-1' })],
      expect.objectContaining({ title: 'New article' }),
    );
    expect(fcm.send).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'fcm-1' })],
      expect.objectContaining({ body: 'Article title' }),
    );
    expect(devices.deactivate).toHaveBeenCalledWith(['expo-1']);
    expect(devices.deactivate).toHaveBeenCalledTimes(1);
  });

  it('logs transient provider errors without throwing', async () => {
    const devices = {
      listActiveByUser: jest.fn().mockResolvedValue([device('expo-1', 'EXPO')]),
      deactivate: jest.fn(),
    } as unknown as jest.Mocked<PrismaPushDeviceRepository>;
    const expo = {
      send: jest.fn().mockRejectedValue(new Error('temporary outage')),
    } as unknown as jest.Mocked<ExpoPushAdapter>;
    const fcm = {
      send: jest.fn(),
    } as unknown as jest.Mocked<FcmPushAdapter>;

    await expect(
      new PushNotificationDispatcher(devices, expo, fcm).sendToUser(userId, {
        title: 'New article',
        body: 'Article title',
      }),
    ).resolves.toBeUndefined();
    expect(devices.deactivate).not.toHaveBeenCalled();
  });
});

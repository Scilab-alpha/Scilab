/* eslint-disable @typescript-eslint/unbound-method */
import {
  PushDeviceRecord,
  PushDeviceRepository,
} from '@/push/application/ports/push.ports';
import { PushProviderResolver } from '@/push/application/push-provider.resolver';
import { RegisterPushDeviceUseCase } from '@/push/application/use-cases/register-push-device/register-push-device.use-case';
import { UnregisterPushDeviceUseCase } from '@/push/application/use-cases/unregister-push-device/unregister-push-device.use-case';
import { PushFailureReason } from '@/push/domain/push.errors';

const userId = '11111111-1111-4111-8111-111111111111';
const token = 'ExponentPushToken[valid]';
const now = new Date('2026-06-01T00:00:00.000Z');

function createRepository(): jest.Mocked<PushDeviceRepository> {
  return {
    register: jest.fn(),
    unregister: jest.fn(),
    listActiveByUser: jest.fn(),
    deactivate: jest.fn(),
  };
}

function pushDevice(partial: Partial<PushDeviceRecord> = {}): PushDeviceRecord {
  return {
    id: 'device-1',
    userId,
    provider: 'EXPO',
    token,
    platform: 'IOS',
    clientDeviceId: 'client-device-1',
    isActive: true,
    lastRegisteredAt: now,
    lastUsedAt: null,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

describe('Push device use cases', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('registers a device with Expo outside production', async () => {
    process.env.NODE_ENV = 'development';
    const devices = createRepository();
    devices.register.mockResolvedValue(pushDevice());

    const result = await new RegisterPushDeviceUseCase(
      devices,
      new PushProviderResolver(),
    ).execute({
      userId,
      token,
      platform: 'IOS',
      clientDeviceId: 'client-device-1',
    });

    expect(devices.register).toHaveBeenCalledWith({
      userId,
      provider: 'EXPO',
      token,
      platform: 'IOS',
      clientDeviceId: 'client-device-1',
    });
    expect(result).toEqual({
      deviceId: 'device-1',
      provider: 'EXPO',
      platform: 'IOS',
      isActive: true,
      lastRegisteredAt: now,
    });
  });

  it('unregisters a device with FCM in production', async () => {
    process.env.NODE_ENV = 'production';
    const devices = createRepository();
    devices.unregister.mockResolvedValue(true);

    await expect(
      new UnregisterPushDeviceUseCase(
        devices,
        new PushProviderResolver(),
      ).execute({ userId, token }),
    ).resolves.toEqual({ unregistered: true });
    expect(devices.unregister).toHaveBeenCalledWith({
      userId,
      provider: 'FCM',
      token,
    });
  });

  it('rejects invalid token and platform values', async () => {
    const devices = createRepository();
    const useCase = new RegisterPushDeviceUseCase(
      devices,
      new PushProviderResolver(),
    );

    await expect(
      useCase.execute({ userId, token: '', platform: 'IOS' }),
    ).rejects.toMatchObject({ reason: PushFailureReason.InvalidInput });
    await expect(
      useCase.execute({ userId, token, platform: 'WATCH' }),
    ).rejects.toMatchObject({ reason: PushFailureReason.InvalidInput });
    expect(devices.register).not.toHaveBeenCalled();
  });
});

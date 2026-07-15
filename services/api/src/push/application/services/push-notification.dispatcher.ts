import { Injectable, Logger } from '@nestjs/common';
import {
  PushDeviceRecord,
  PushMessage,
} from '@/push/application/ports/push.ports';
import { ExpoPushAdapter } from '@/push/infrastructure/delivery/expo-push.adapter';
import { FcmPushAdapter } from '@/push/infrastructure/delivery/fcm-push.adapter';
import { PrismaPushDeviceRepository } from '@/push/infrastructure/persistence/prisma-push-device.repository';

@Injectable()
export class PushNotificationDispatcher {
  private readonly logger = new Logger(PushNotificationDispatcher.name);

  constructor(
    private readonly devices: PrismaPushDeviceRepository,
    private readonly expo: ExpoPushAdapter,
    private readonly fcm: FcmPushAdapter,
  ) {}

  async sendToUser(userId: string, message: PushMessage): Promise<void> {
    const devices = await this.devices.listActiveByUser(userId);
    const expoDevices = devices.filter((device) => device.provider === 'EXPO');
    const fcmDevices = devices.filter((device) => device.provider === 'FCM');

    await Promise.all([
      this.sendWithAdapter('EXPO', expoDevices, message),
      this.sendWithAdapter('FCM', fcmDevices, message),
    ]);
  }

  private async sendWithAdapter(
    provider: 'EXPO' | 'FCM',
    devices: PushDeviceRecord[],
    message: PushMessage,
  ): Promise<void> {
    if (devices.length === 0) {
      return;
    }

    try {
      const result =
        provider === 'EXPO'
          ? await this.expo.send(devices, message)
          : await this.fcm.send(devices, message);
      const deactivated =
        result.invalidDeviceIds.length > 0
          ? await this.devices.deactivate(result.invalidDeviceIds)
          : 0;

      if (deactivated > 0) {
        this.logger.warn(
          JSON.stringify({
            type: 'PUSH_DEVICES_DEACTIVATED',
            provider,
            deactivated,
          }),
        );
      }
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          type: 'PUSH_DELIVERY_FAILED',
          provider,
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

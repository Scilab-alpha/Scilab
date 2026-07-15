import { Injectable } from '@nestjs/common';
import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import {
  PushDeliveryAdapter,
  PushDeliveryResult,
  PushDeviceRecord,
  PushMessage,
} from '@/push/application/ports/push.ports';

const INVALID_FCM_CODES = new Set([
  'messaging/invalid-argument',
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

@Injectable()
export class FcmPushAdapter implements PushDeliveryAdapter {
  private app?: App;

  async send(
    devices: PushDeviceRecord[],
    message: PushMessage,
  ): Promise<PushDeliveryResult> {
    if (devices.length === 0) {
      return { invalidDeviceIds: [] };
    }

    const response = await getMessaging(this.getApp()).sendEachForMulticast({
      tokens: devices.map((device) => device.token),
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.data ?? {},
    });
    const invalidDeviceIds: string[] = [];

    response.responses.forEach((item, index) => {
      if (item.error && INVALID_FCM_CODES.has(item.error.code)) {
        invalidDeviceIds.push(devices[index].id);
      }
    });

    return { invalidDeviceIds };
  }

  private getApp(): App {
    if (this.app) {
      return this.app;
    }

    const existing = getApps()[0];
    if (existing) {
      this.app = existing;
      return existing;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    this.app =
      projectId && clientEmail && privateKey
        ? initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          })
        : initializeApp({
            credential: applicationDefault(),
            projectId,
          });

    return this.app;
  }
}

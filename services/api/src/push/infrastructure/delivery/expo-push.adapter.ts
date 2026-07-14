import { Injectable } from '@nestjs/common';
import {
  PushDeliveryAdapter,
  PushDeliveryResult,
  PushDeviceRecord,
  PushMessage,
} from '@/push/application/ports/push.ports';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_DEVICE_NOT_REGISTERED = 'DeviceNotRegistered';

interface ExpoPushTicket {
  status?: string;
  details?: {
    error?: string;
  };
}

interface ExpoPushResponse {
  data?: ExpoPushTicket | ExpoPushTicket[];
}

@Injectable()
export class ExpoPushAdapter implements PushDeliveryAdapter {
  async send(
    devices: PushDeviceRecord[],
    message: PushMessage,
  ): Promise<PushDeliveryResult> {
    if (devices.length === 0) {
      return { invalidDeviceIds: [] };
    }

    const body = devices.map((device) => ({
      to: device.token,
      title: message.title,
      body: message.body,
      data: message.data ?? {},
      sound: 'default',
    }));
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body.length === 1 ? body[0] : body),
    });

    if (!response.ok) {
      throw new Error(`Expo push failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ExpoPushResponse;
    const tickets = normalizeTickets(payload.data);
    const invalidDeviceIds: string[] = [];

    tickets.forEach((ticket, index) => {
      const device = devices[index];
      if (device && ticket.details?.error === EXPO_DEVICE_NOT_REGISTERED) {
        invalidDeviceIds.push(device.id);
      }
    });

    return { invalidDeviceIds };
  }
}

function normalizeTickets(data: ExpoPushResponse['data']): ExpoPushTicket[] {
  if (!data) {
    return [];
  }

  return Array.isArray(data) ? data : [data];
}

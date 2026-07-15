import {
  PushPlatform,
  PushProvider,
} from '@/push/application/ports/push.ports';

export interface RegisterPushDeviceInput {
  userId: string;
  token: unknown;
  platform?: unknown;
  clientDeviceId?: unknown;
}

export interface RegisterPushDeviceOutput {
  deviceId: string;
  provider: PushProvider;
  platform: PushPlatform;
  isActive: boolean;
  lastRegisteredAt: Date;
}

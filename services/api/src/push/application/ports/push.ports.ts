export type PushProvider = 'EXPO' | 'FCM';
export type PushPlatform = 'IOS' | 'ANDROID' | 'WEB' | 'UNKNOWN';

export interface PushDeviceRecord {
  id: string;
  userId: string;
  provider: PushProvider;
  token: string;
  platform: PushPlatform;
  clientDeviceId: string | null;
  isActive: boolean;
  lastRegisteredAt: Date;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterPushDeviceInput {
  userId: string;
  provider: PushProvider;
  token: string;
  platform: PushPlatform;
  clientDeviceId?: string | null;
}

export interface PushDeviceRepository {
  register(input: RegisterPushDeviceInput): Promise<PushDeviceRecord>;
  unregister(input: {
    userId: string;
    provider: PushProvider;
    token: string;
  }): Promise<boolean>;
  listActiveByUser(userId: string): Promise<PushDeviceRecord[]>;
  deactivate(deviceIds: string[]): Promise<number>;
}

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushDeliveryResult {
  invalidDeviceIds: string[];
}

export interface PushDeliveryAdapter {
  send(
    devices: PushDeviceRecord[],
    message: PushMessage,
  ): Promise<PushDeliveryResult>;
}

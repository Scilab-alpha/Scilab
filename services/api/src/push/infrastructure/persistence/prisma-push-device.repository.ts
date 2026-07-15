import { Injectable } from '@nestjs/common';
import { UserPushDevice } from '@prisma/client';
import {
  PushDeviceRecord,
  PushDeviceRepository,
  PushPlatform,
  PushProvider,
  RegisterPushDeviceInput,
} from '@/push/application/ports/push.ports';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaPushDeviceRepository implements PushDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterPushDeviceInput): Promise<PushDeviceRecord> {
    const registeredAt = new Date();
    const device = await this.prisma.userPushDevice.upsert({
      where: {
        userId_provider_token: {
          userId: input.userId,
          provider: input.provider,
          token: input.token,
        },
      },
      update: {
        platform: input.platform,
        clientDeviceId: input.clientDeviceId ?? null,
        isActive: true,
        lastRegisteredAt: registeredAt,
      },
      create: {
        userId: input.userId,
        provider: input.provider,
        token: input.token,
        platform: input.platform,
        clientDeviceId: input.clientDeviceId ?? null,
        isActive: true,
        lastRegisteredAt: registeredAt,
      },
    });

    return this.toRecord(device);
  }

  async unregister(input: {
    userId: string;
    provider: PushProvider;
    token: string;
  }): Promise<boolean> {
    const result = await this.prisma.userPushDevice.updateMany({
      where: {
        userId: input.userId,
        provider: input.provider,
        token: input.token,
      },
      data: { isActive: false },
    });

    return result.count > 0;
  }

  async listActiveByUser(userId: string): Promise<PushDeviceRecord[]> {
    const devices = await this.prisma.userPushDevice.findMany({
      where: { userId, isActive: true },
    });

    return devices.map((device) => this.toRecord(device));
  }

  async deactivate(deviceIds: string[]): Promise<number> {
    if (deviceIds.length === 0) {
      return 0;
    }

    const result = await this.prisma.userPushDevice.updateMany({
      where: { id: { in: deviceIds } },
      data: { isActive: false },
    });

    return result.count;
  }

  private toRecord(device: UserPushDevice): PushDeviceRecord {
    return {
      id: device.id,
      userId: device.userId,
      provider: String(device.provider) as PushProvider,
      token: device.token,
      platform: String(device.platform) as PushPlatform,
      clientDeviceId: device.clientDeviceId,
      isActive: device.isActive,
      lastRegisteredAt: device.lastRegisteredAt,
      lastUsedAt: device.lastUsedAt,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }
}

import { PushDeviceRepository } from '@/push/application/ports/push.ports';
import { PushProviderResolver } from '@/push/application/push-provider.resolver';
import {
  parseClientDeviceId,
  parsePushPlatform,
  parsePushToken,
} from '@/push/application/use-cases/push-device-input';
import {
  RegisterPushDeviceInput,
  RegisterPushDeviceOutput,
} from '@/push/application/use-cases/register-push-device/register-push-device.dto';

export class RegisterPushDeviceUseCase {
  constructor(
    private readonly devices: PushDeviceRepository,
    private readonly providers: PushProviderResolver,
  ) {}

  async execute(
    input: RegisterPushDeviceInput,
  ): Promise<RegisterPushDeviceOutput> {
    const device = await this.devices.register({
      userId: input.userId,
      provider: this.providers.resolve(),
      token: parsePushToken(input.token),
      platform: parsePushPlatform(input.platform),
      clientDeviceId: parseClientDeviceId(input.clientDeviceId),
    });

    return {
      deviceId: device.id,
      provider: device.provider,
      platform: device.platform,
      isActive: device.isActive,
      lastRegisteredAt: device.lastRegisteredAt,
    };
  }
}

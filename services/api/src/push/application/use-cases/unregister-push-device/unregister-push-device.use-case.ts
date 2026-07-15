import { PushDeviceRepository } from '@/push/application/ports/push.ports';
import { PushProviderResolver } from '@/push/application/push-provider.resolver';
import { parsePushToken } from '@/push/application/use-cases/push-device-input';
import {
  UnregisterPushDeviceInput,
  UnregisterPushDeviceOutput,
} from '@/push/application/use-cases/unregister-push-device/unregister-push-device.dto';

export class UnregisterPushDeviceUseCase {
  constructor(
    private readonly devices: PushDeviceRepository,
    private readonly providers: PushProviderResolver,
  ) {}

  async execute(
    input: UnregisterPushDeviceInput,
  ): Promise<UnregisterPushDeviceOutput> {
    return {
      unregistered: await this.devices.unregister({
        userId: input.userId,
        provider: this.providers.resolve(),
        token: parsePushToken(input.token),
      }),
    };
  }
}

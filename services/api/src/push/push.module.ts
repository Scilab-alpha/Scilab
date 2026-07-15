import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { PushProviderResolver } from '@/push/application/push-provider.resolver';
import { PushNotificationDispatcher } from '@/push/application/services/push-notification.dispatcher';
import { RegisterPushDeviceUseCase } from '@/push/application/use-cases/register-push-device/register-push-device.use-case';
import { UnregisterPushDeviceUseCase } from '@/push/application/use-cases/unregister-push-device/unregister-push-device.use-case';
import { ExpoPushAdapter } from '@/push/infrastructure/delivery/expo-push.adapter';
import { FcmPushAdapter } from '@/push/infrastructure/delivery/fcm-push.adapter';
import { PrismaPushDeviceRepository } from '@/push/infrastructure/persistence/prisma-push-device.repository';
import { PushDeviceController } from '@/push/interfaces/http/push-device.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PushDeviceController],
  providers: [
    PrismaPushDeviceRepository,
    PushProviderResolver,
    ExpoPushAdapter,
    FcmPushAdapter,
    PushNotificationDispatcher,
    {
      provide: RegisterPushDeviceUseCase,
      useFactory: (
        devices: PrismaPushDeviceRepository,
        providers: PushProviderResolver,
      ) => new RegisterPushDeviceUseCase(devices, providers),
      inject: [PrismaPushDeviceRepository, PushProviderResolver],
    },
    {
      provide: UnregisterPushDeviceUseCase,
      useFactory: (
        devices: PrismaPushDeviceRepository,
        providers: PushProviderResolver,
      ) => new UnregisterPushDeviceUseCase(devices, providers),
      inject: [PrismaPushDeviceRepository, PushProviderResolver],
    },
  ],
  exports: [PushNotificationDispatcher, PrismaPushDeviceRepository],
})
export class PushModule {}

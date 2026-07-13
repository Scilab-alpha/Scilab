import { Injectable } from '@nestjs/common';
import { PushProvider } from '@/push/application/ports/push.ports';

@Injectable()
export class PushProviderResolver {
  resolve(): PushProvider {
    return process.env.NODE_ENV === 'production' ? 'FCM' : 'EXPO';
  }
}

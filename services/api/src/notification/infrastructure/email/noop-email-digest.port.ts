import { Injectable, Logger } from '@nestjs/common';
import {
  EmailDigestMessage,
  EmailDigestPort,
} from '@/notification/application/ports/notification.ports';

@Injectable()
export class NoopEmailDigestPort implements EmailDigestPort {
  private readonly logger = new Logger(NoopEmailDigestPort.name);

  send(message: EmailDigestMessage): Promise<void> {
    this.logger.log(
      JSON.stringify({
        type: 'EMAIL_DIGEST_SKIPPED',
        userId: message.userId,
        subject: message.subject,
      }),
    );
    return Promise.resolve();
  }
}

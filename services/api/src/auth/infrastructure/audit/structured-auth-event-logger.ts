import { Injectable, Logger } from '@nestjs/common';
import { AuthEventLogger } from '@/auth/application/ports/auth.ports';
import { AuthEvent } from '@/auth/domain/auth-event';

@Injectable()
export class StructuredAuthEventLogger implements AuthEventLogger {
  private readonly logger = new Logger(StructuredAuthEventLogger.name);

  record(event: AuthEvent): Promise<void> {
    const { type, occurredAt, userId, email, reason } = event;
    this.logger.log(
      JSON.stringify({
        type,
        occurredAt: occurredAt.toISOString(),
        userId,
        email,
        reason,
      }),
    );
    return Promise.resolve();
  }
}

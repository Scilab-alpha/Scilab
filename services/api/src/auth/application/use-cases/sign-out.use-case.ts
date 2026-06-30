import {
  AuthEventLogger,
  SessionRepository,
} from '@/auth/application/ports/auth.ports';
import { AuthEventType } from '@/auth/domain/auth-event';

export class SignOutUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly audit: AuthEventLogger,
  ) {}

  async execute(input: { sessionId: string; userId: string }) {
    await this.sessions.revokeById(input.sessionId, new Date());
    await this.audit.record({
      type: AuthEventType.SignOut,
      occurredAt: new Date(),
      userId: input.userId,
    });
  }
}

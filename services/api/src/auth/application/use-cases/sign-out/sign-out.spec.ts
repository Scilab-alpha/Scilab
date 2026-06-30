import { SignOutUseCase } from './sign-out.use-case';
import {
  fakeAudit,
  fakeSessions,
} from '@/auth/application/testing/test-doubles';

describe('SignOutUseCase', () => {
  it('revokes the current session idempotently and records an audit event', async () => {
    const sessions = fakeSessions();
    const audit = fakeAudit();
    const useCase = new SignOutUseCase(sessions, audit);

    await useCase.execute({ sessionId: 'session-1', userId: 'user-1' });
    await useCase.execute({ sessionId: 'session-1', userId: 'user-1' });

    expect(sessions.revoked).toEqual(['session-1', 'session-1']);
    expect(audit.events).toHaveLength(2);
  });
});

import { ValidateAccessTokenUseCase } from '@/auth/application/use-cases/validate-access-token.use-case';
import { AuthFailureReason } from '@/auth/domain/auth.errors';
import { fakeAudit, fakeSessions, fakeTokens, fakeUsers } from './test-doubles';

describe('ValidateAccessTokenUseCase', () => {
  it('returns authenticated identity for valid active sessions', async () => {
    const useCase = new ValidateAccessTokenUseCase(
      fakeUsers(),
      fakeSessions(),
      fakeTokens(),
      fakeAudit(),
    );

    await expect(useCase.execute('access-token')).resolves.toMatchObject({
      userId: 'user-1',
      sessionId: 'session-1',
      email: 'user@example.com',
    });
  });

  it('denies revoked sessions', async () => {
    const useCase = new ValidateAccessTokenUseCase(
      fakeUsers(),
      fakeSessions({ revoked: true }),
      fakeTokens(),
      fakeAudit(),
    );

    await expect(useCase.execute('access-token')).rejects.toMatchObject({
      reason: AuthFailureReason.TokenRevoked,
    });
  });

  it('denies inactive users', async () => {
    const useCase = new ValidateAccessTokenUseCase(
      fakeUsers({ status: 'BANNED' }),
      fakeSessions(),
      fakeTokens(),
      fakeAudit(),
    );

    await expect(useCase.execute('access-token')).rejects.toMatchObject({
      reason: AuthFailureReason.UserMissing,
    });
  });
});

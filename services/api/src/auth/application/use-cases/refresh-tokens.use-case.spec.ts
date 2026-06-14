import { RefreshTokensUseCase } from '@/auth/application/use-cases/refresh-tokens.use-case';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';
import { fakeAudit, fakeSessions, fakeTokens, fakeUsers } from './test-doubles';

describe('RefreshTokensUseCase', () => {
  it('rotates a valid refresh token into a new token pair', async () => {
    const sessions = fakeSessions();
    const useCase = new RefreshTokensUseCase(
      fakeUsers(),
      sessions,
      fakeTokens(),
      fakeAudit(),
    );

    await expect(useCase.execute('refresh-token-value')).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token-value',
    });
    expect(sessions.rotated).toHaveLength(1);
  });

  it('denies malformed refresh tokens', async () => {
    const useCase = new RefreshTokensUseCase(
      fakeUsers(),
      fakeSessions(),
      fakeTokens(),
      fakeAudit(),
    );

    await expect(
      useCase.execute('bad'),
    ).rejects.toMatchObject<AuthUseCaseError>({
      reason: AuthFailureReason.TokenMalformed,
    });
  });

  it('denies reused refresh tokens', async () => {
    const useCase = new RefreshTokensUseCase(
      fakeUsers(),
      fakeSessions({ refreshSession: null }),
      fakeTokens(),
      fakeAudit(),
    );

    await expect(useCase.execute('refresh-token-value')).rejects.toMatchObject({
      reason: AuthFailureReason.RefreshReused,
    });
  });
});

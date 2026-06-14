import { SignInUseCase } from '@/auth/application/use-cases/sign-in.use-case';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';
import {
  fakeAudit,
  fakeHasher,
  fakeSessions,
  fakeTokens,
  fakeUsers,
} from './test-doubles';

describe('SignInUseCase', () => {
  it('creates a token pair and persisted session for valid active users', async () => {
    const sessions = fakeSessions();
    const useCase = new SignInUseCase(
      fakeUsers(),
      sessions,
      fakeHasher(true),
      fakeTokens(),
      fakeAudit(),
    );

    await expect(
      useCase.execute({ email: 'User@Example.com', password: 'Password123!' }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token-value',
    });
    expect(sessions.created).toHaveLength(1);
    expect(sessions.created[0].refreshTokenExpiresAt.getTime()).toBeGreaterThan(
      sessions.created[0].accessTokenExpiresAt.getTime(),
    );
  });

  it('denies invalid credentials with a generic failure', async () => {
    const useCase = new SignInUseCase(
      fakeUsers(),
      fakeSessions(),
      fakeHasher(false),
      fakeTokens(),
      fakeAudit(),
    );

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toMatchObject<AuthUseCaseError>({
      reason: AuthFailureReason.InvalidCredentials,
    });
  });

  it('denies inactive accounts', async () => {
    const useCase = new SignInUseCase(
      fakeUsers({ status: 'INACTIVE' }),
      fakeSessions(),
      fakeHasher(true),
      fakeTokens(),
      fakeAudit(),
    );

    await expect(
      useCase.execute({ email: 'user@example.com', password: 'Password123!' }),
    ).rejects.toMatchObject<AuthUseCaseError>({
      reason: AuthFailureReason.AccountInactive,
    });
  });
});

import { AuthFailureReason } from '@/auth/domain/auth.errors';
import { fakeUsers } from '@/auth/application/testing/test-doubles';
import { GetCurrentUserUseCase } from './get-current-user.use-case';

describe('GetCurrentUserUseCase', () => {
  it('returns the current active user without the session id', async () => {
    const useCase = new GetCurrentUserUseCase(fakeUsers());

    await expect(
      useCase.execute({
        userId: 'user-1',
        sessionId: 'session-1',
        email: 'user@example.com',
        status: 'ACTIVE',
        role: 'STUDENT',
        firstName: 'Test',
        lastName: 'User',
        imageUrl: null,
      }),
    ).resolves.toEqual({
      userId: 'user-1',
      email: 'user@example.com',
      status: 'ACTIVE',
      role: 'STUDENT',
      firstName: 'Test',
      lastName: 'User',
      imageUrl: null,
    });
  });

  it('denies missing users', async () => {
    const useCase = new GetCurrentUserUseCase(fakeUsers(null));

    await expect(
      useCase.execute({
        userId: 'missing-user',
        sessionId: 'session-1',
        email: 'missing@example.com',
        status: 'ACTIVE',
        role: 'STUDENT',
        firstName: null,
        lastName: null,
        imageUrl: null,
      }),
    ).rejects.toMatchObject({
      reason: AuthFailureReason.UserMissing,
    });
  });
});

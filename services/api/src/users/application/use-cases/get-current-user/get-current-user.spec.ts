import { UserFailureReason } from '@/users/domain/user.errors';
import { fakeUsers } from '@/users/application/testing/test-doubles';
import { GetCurrentUserUseCase } from './get-current-user.use-case';

describe('GetCurrentUserUseCase', () => {
  it('returns the authenticated user by access token subject', async () => {
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
    ).resolves.toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
      role: 'STUDENT',
    });
  });

  it('denies missing authenticated users', async () => {
    const useCase = new GetCurrentUserUseCase(fakeUsers({ existing: null }));

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
      reason: UserFailureReason.UserMissing,
    });
  });
});

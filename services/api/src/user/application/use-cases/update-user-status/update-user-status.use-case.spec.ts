import { fakeUserRepository } from '@/user/application/testing/test-doubles';
import { UpdateUserStatusUseCase } from '@/user/application/use-cases/update-user-status/update-user-status.use-case';
import { UserFailureReason } from '@/user/domain/user.errors';

describe('UpdateUserStatusUseCase', () => {
  it('updates valid statuses', async () => {
    const users = fakeUserRepository();
    const useCase = new UpdateUserStatusUseCase(users);

    await expect(
      useCase.execute({ userId: 'user-1', status: 'banned' }),
    ).resolves.toMatchObject({
      status: 'BANNED',
    });

    expect(users.updatedStatuses).toEqual([
      { userId: 'user-1', status: 'BANNED' },
    ]);
  });

  it('denies invalid statuses', async () => {
    const useCase = new UpdateUserStatusUseCase(fakeUserRepository());

    await expect(
      useCase.execute({ userId: 'user-1', status: 'LOCKED' }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.InvalidInput,
    });
  });
});

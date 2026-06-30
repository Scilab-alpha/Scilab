import { UserFailureReason } from '@/users/domain/user.errors';
import { fakeUsers } from '@/users/application/testing/test-doubles';
import { DeleteUserUseCase } from './delete-user.use-case';

describe('DeleteUserUseCase', () => {
  it('deletes an existing user for admin workflows', async () => {
    const users = fakeUsers();
    const useCase = new DeleteUserUseCase(users);

    await expect(useCase.execute('user-1')).resolves.toBeUndefined();

    expect(users.deleted).toEqual(['user-1']);
  });

  it('denies missing users', async () => {
    const useCase = new DeleteUserUseCase(fakeUsers({ existing: null }));

    await expect(useCase.execute('missing-user')).rejects.toMatchObject({
      reason: UserFailureReason.UserMissing,
    });
  });
});

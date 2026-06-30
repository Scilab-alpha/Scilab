import { UserFailureReason } from '@/users/domain/user.errors';
import { fakeUsers } from '@/users/application/testing/test-doubles';
import { GetUserUseCase } from './get-user.use-case';

describe('GetUserUseCase', () => {
  it('returns a user by id for admin workflows', async () => {
    const useCase = new GetUserUseCase(fakeUsers());

    await expect(useCase.execute('user-1')).resolves.toMatchObject({
      id: 'user-1',
      email: 'user@example.com',
    });
  });

  it('denies missing users', async () => {
    const useCase = new GetUserUseCase(fakeUsers({ existing: null }));

    await expect(useCase.execute('missing-user')).rejects.toMatchObject({
      reason: UserFailureReason.UserMissing,
    });
  });
});

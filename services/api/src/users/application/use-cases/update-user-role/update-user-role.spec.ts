import { fakeUsers } from '@/users/application/testing/test-doubles';
import { UserFailureReason } from '@/users/domain/user.errors';
import { UpdateUserRoleUseCase } from './update-user-role.use-case';

describe('UpdateUserRoleUseCase', () => {
  it('updates a user role to researcher or student', async () => {
    const users = fakeUsers();
    const useCase = new UpdateUserRoleUseCase(users);

    await expect(
      useCase.execute('user-1', { role: 'researcher' }),
    ).resolves.toMatchObject({
      id: 'user-1',
      role: 'RESEARCHER',
    });

    expect(users.updated[0]).toEqual({
      id: 'user-1',
      data: { role: 'RESEARCHER' },
    });
  });

  it('denies admin role assignment through the role endpoint', async () => {
    const useCase = new UpdateUserRoleUseCase(fakeUsers());

    await expect(
      useCase.execute('user-1', { role: 'ADMIN' }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.InvalidUserInput,
    });
  });

  it('denies missing users', async () => {
    const useCase = new UpdateUserRoleUseCase(fakeUsers({ existing: null }));

    await expect(
      useCase.execute('missing-user', { role: 'STUDENT' }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.UserMissing,
    });
  });
});

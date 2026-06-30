import { fakeUserRepository } from '@/user/application/testing/test-doubles';
import { UpdateUserRoleUseCase } from '@/user/application/use-cases/update-user-role/update-user-role.use-case';
import { UserFailureReason } from '@/user/domain/user.errors';

describe('UpdateUserRoleUseCase', () => {
  it('updates valid roles', async () => {
    const users = fakeUserRepository();
    const useCase = new UpdateUserRoleUseCase(users);

    await expect(
      useCase.execute({ userId: 'user-1', role: 'researcher' }),
    ).resolves.toMatchObject({
      role: 'RESEARCHER',
    });

    expect(users.updatedRoles).toEqual([
      { userId: 'user-1', role: 'RESEARCHER' },
    ]);
  });

  it('denies admin role patches', async () => {
    const useCase = new UpdateUserRoleUseCase(fakeUserRepository());

    await expect(
      useCase.execute({ userId: 'user-1', role: 'ADMIN' }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.InvalidInput,
    });
  });

  it('denies unknown roles', async () => {
    const useCase = new UpdateUserRoleUseCase(fakeUserRepository());

    await expect(
      useCase.execute({ userId: 'user-1', role: 'OWNER' }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.InvalidInput,
    });
  });
});

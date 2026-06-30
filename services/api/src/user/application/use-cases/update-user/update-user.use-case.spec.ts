import {
  fakeUserRecord,
  fakeUserRepository,
} from '@/user/application/testing/test-doubles';
import { UpdateUserUseCase } from '@/user/application/use-cases/update-user/update-user.use-case';
import { UserFailureReason } from '@/user/domain/user.errors';

describe('UpdateUserUseCase', () => {
  it('normalizes and updates user profile fields', async () => {
    const users = fakeUserRepository();
    const useCase = new UpdateUserUseCase(users);

    await expect(
      useCase.execute({
        userId: 'user-1',
        data: {
          email: ' New.Email@Example.com ',
          firstname: ' New ',
          lastname: ' Name ',
          gender: 'female',
          dateofbirth: '2002-05-13',
        },
      }),
    ).resolves.toMatchObject({
      email: 'new.email@example.com',
      firstName: 'New',
      lastName: 'Name',
      gender: 'FEMALE',
    });

    expect(users.updatedProfiles[0]).toMatchObject({
      userId: 'user-1',
      data: {
        email: 'new.email@example.com',
        firstName: 'New',
        lastName: 'Name',
        gender: 'FEMALE',
      },
    });
  });

  it('denies duplicate emails', async () => {
    const users = fakeUserRepository([
      fakeUserRecord(),
      fakeUserRecord({ id: 'user-2', email: 'used@example.com' }),
    ]);
    const useCase = new UpdateUserUseCase(users);

    await expect(
      useCase.execute({
        userId: 'user-1',
        data: { email: 'used@example.com' },
      }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.EmailAlreadyUsed,
    });
  });

  it('denies empty patch bodies', async () => {
    const useCase = new UpdateUserUseCase(fakeUserRepository());

    await expect(
      useCase.execute({
        userId: 'user-1',
        data: {},
      }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.InvalidInput,
    });
  });
});

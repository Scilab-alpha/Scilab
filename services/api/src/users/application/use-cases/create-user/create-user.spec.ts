import { UserFailureReason } from '@/users/domain/user.errors';
import {
  fakeHasher,
  fakeUsers,
  userRecord,
} from '@/users/application/testing/test-doubles';
import { CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  it('creates a managed user with normalized email and hashed password', async () => {
    const users = fakeUsers();
    const hasher = fakeHasher();
    const useCase = new CreateUserUseCase(users, hasher);

    await expect(
      useCase.execute({
        email: ' Researcher@Example.com ',
        password: 'Password123!',
        type: 'EMAIL',
        status: 'ACTIVE',
        role: 'RESEARCHER',
        firstName: 'Research',
        lastName: 'User',
        dateOfBirth: '1999-12-31',
        gender: 'OTHER',
      }),
    ).resolves.toMatchObject({
      id: 'created-user-1',
      email: 'researcher@example.com',
      role: 'RESEARCHER',
    });

    expect(hasher.hash).toHaveBeenCalledWith('Password123!');
    expect(users.created[0]).toEqual(
      expect.objectContaining({
        email: 'researcher@example.com',
        password: 'hash:Password123!',
        type: 'EMAIL',
        status: 'ACTIVE',
        role: 'RESEARCHER',
        dateOfBirth: new Date('1999-12-31T00:00:00.000Z'),
        gender: 'OTHER',
      }),
    );
  });

  it('denies duplicate emails', async () => {
    const useCase = new CreateUserUseCase(
      fakeUsers({ duplicate: userRecord({ email: 'user@example.com' }) }),
      fakeHasher(),
    );

    await expect(
      useCase.execute({
        email: 'user@example.com',
        password: 'Password123!',
        type: 'EMAIL',
        status: 'ACTIVE',
        role: 'STUDENT',
      }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.EmailAlreadyExists,
    });
  });

  it('denies invalid user input', async () => {
    const useCase = new CreateUserUseCase(fakeUsers(), fakeHasher());

    await expect(
      useCase.execute({
        email: 'invalid-email',
        password: 'short',
        type: 'EMAIL',
        status: 'ACTIVE',
        role: 'STUDENT',
      }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.InvalidUserInput,
    });
  });
});

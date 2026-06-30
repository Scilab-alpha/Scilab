import { UserFailureReason } from '@/users/domain/user.errors';
import {
  fakeUsers,
  userRecord,
} from '@/users/application/testing/test-doubles';
import { UpdateUserUseCase } from './update-user.use-case';

describe('UpdateUserUseCase', () => {
  it('updates only editable profile fields', async () => {
    const users = fakeUsers();
    const useCase = new UpdateUserUseCase(users);

    await expect(
      useCase.execute('user-1', {
        email: ' Updated@Example.com ',
        firstName: 'Updated',
        lastName: 'User',
        imageUrl: 'https://example.com/avatar.png',
        dateOfBirth: '1999-12-31',
        gender: 'OTHER',
      }),
    ).resolves.toMatchObject({
      id: 'user-1',
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      imageUrl: 'https://example.com/avatar.png',
      dateOfBirth: new Date('1999-12-31T00:00:00.000Z'),
      gender: 'OTHER',
    });

    expect(users.updated[0]?.id).toBe('user-1');
    expect(users.updated[0]?.data).toMatchObject({
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'User',
      imageUrl: 'https://example.com/avatar.png',
      dateOfBirth: new Date('1999-12-31T00:00:00.000Z'),
      gender: 'OTHER',
    });
    expect(users.updated[0]?.data).not.toHaveProperty('password');
    expect(users.updated[0]?.data).not.toHaveProperty('type');
    expect(users.updated[0]?.data).not.toHaveProperty('status');
    expect(users.updated[0]?.data).not.toHaveProperty('role');
  });

  it('denies duplicate replacement emails', async () => {
    const useCase = new UpdateUserUseCase(
      fakeUsers({
        existing: userRecord({ id: 'user-1', email: 'old@example.com' }),
        duplicate: userRecord({ id: 'user-2', email: 'new@example.com' }),
      }),
    );

    await expect(
      useCase.execute('user-1', { email: 'new@example.com' }),
    ).rejects.toMatchObject({
      reason: UserFailureReason.EmailAlreadyExists,
    });
  });
});

import { RegisterUseCase } from './register.use-case';
import { AuthFailureReason } from '@/auth/domain/auth.errors';
import {
  fakeAudit,
  fakeHasher,
  fakeUsers,
} from '@/auth/application/testing/test-doubles';

describe('RegisterUseCase', () => {
  it('registers active student accounts without creating a session', async () => {
    const users = fakeUsers(null);
    const useCase = new RegisterUseCase(
      users,
      fakeHasher(true),
      fakeAudit(),
      'Admin@admin.com',
    );

    await expect(
      useCase.execute({
        email: 'Student@Example.com',
        password: '12345678',
        firstName: 'Student',
        lastName: 'User',
        dateOfBirth: '2000-01-02',
        gender: 'FEMALE',
      }),
    ).resolves.toBeUndefined();

    expect(users.created[0]).toMatchObject({
      email: 'student@example.com',
      role: 'STUDENT',
      status: 'ACTIVE',
      type: 'EMAIL',
      firstName: 'Student',
      lastName: 'User',
      dateOfBirth: new Date('2000-01-02T00:00:00.000Z'),
      gender: 'FEMALE',
    });
  });

  it('denies registration with the reserved admin account email', async () => {
    const useCase = new RegisterUseCase(
      fakeUsers(null),
      fakeHasher(true),
      fakeAudit(),
      'Admin@admin.com',
    );

    await expect(
      useCase.execute({
        email: 'Admin@admin.com',
        password: '12345678',
        firstName: 'Admin',
        lastName: 'User',
        dateOfBirth: '2000-01-02',
        gender: 'MALE',
      }),
    ).rejects.toMatchObject({
      reason: AuthFailureReason.ReservedAdminEmail,
    });
  });

  it('denies duplicate emails', async () => {
    const useCase = new RegisterUseCase(
      fakeUsers(),
      fakeHasher(true),
      fakeAudit(),
      'Admin@admin.com',
    );

    await expect(
      useCase.execute({
        email: 'user@example.com',
        password: '12345678',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '2000-01-02',
        gender: 'OTHER',
      }),
    ).rejects.toMatchObject({
      reason: AuthFailureReason.EmailAlreadyExists,
    });
  });
});

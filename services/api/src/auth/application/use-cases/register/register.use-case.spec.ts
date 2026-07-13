import { RegisterUseCase } from '@/auth/application/use-cases/register/register.use-case';
import { AuthFailureReason } from '@/auth/domain/auth.errors';
import {
  fakeAudit,
  fakeHasher,
  fakeUsers,
} from '@/auth/application/testing/test-doubles';

describe('RegisterUseCase', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates active student accounts only', async () => {
    const users = fakeUsers();
    users.findByEmail = jest.fn(() => Promise.resolve(null));
    const useCase = new RegisterUseCase(users, fakeHasher(true), fakeAudit());

    await expect(
      useCase.execute({
        email: 'New.User@example.com',
        password: 'Password123!',
        firstname: 'New',
        lastname: 'User',
        gender: 'MALE',
        dataofbirth: '2001-04-12',
      }),
    ).resolves.toMatchObject({
      email: 'new.user@example.com',
      role: 'STUDENT',
      status: 'ACTIVE',
      firstName: 'New',
      lastName: 'User',
      gender: 'MALE',
    });

    expect(users.createdStudents).toHaveLength(1);
    expect(users.createdStudents[0]).toMatchObject({
      email: 'new.user@example.com',
      firstName: 'New',
      lastName: 'User',
      gender: 'MALE',
    });
  });

  it('denies duplicate emails', async () => {
    const useCase = new RegisterUseCase(
      fakeUsers(),
      fakeHasher(true),
      fakeAudit(),
    );

    await expect(
      useCase.execute({
        email: 'user@example.com',
        password: 'Password123!',
        firstname: 'Test',
        lastname: 'User',
        gender: 'FEMALE',
        dataofbirth: '2001-04-12',
      }),
    ).rejects.toMatchObject({
      reason: AuthFailureReason.EmailAlreadyRegistered,
    });
  });

  it('denies the configured admin email', async () => {
    process.env = {
      ...originalEnv,
      ADMIN_EMAIL: 'Admin@admin.com',
    };
    const users = fakeUsers();
    const findByEmail = jest.fn(() => Promise.resolve(null));
    users.findByEmail = findByEmail;
    const useCase = new RegisterUseCase(users, fakeHasher(true), fakeAudit());

    await expect(
      useCase.execute({
        email: 'admin@admin.com',
        password: 'Password123!',
        firstname: 'Admin',
        lastname: 'User',
        gender: 'FEMALE',
        dataofbirth: '2001-04-12',
      }),
    ).rejects.toMatchObject({
      reason: AuthFailureReason.EmailAlreadyRegistered,
    });

    expect(findByEmail).not.toHaveBeenCalled();
  });

  it('denies invalid registration input', async () => {
    const users = fakeUsers();
    users.findByEmail = jest.fn(() => Promise.resolve(null));
    const useCase = new RegisterUseCase(users, fakeHasher(true), fakeAudit());

    await expect(
      useCase.execute({
        email: 'bad@example.com',
        password: 'short',
        firstname: 'Bad',
        lastname: 'Input',
        gender: 'MALE',
        dataofbirth: 'not-a-date',
      }),
    ).rejects.toMatchObject({
      reason: AuthFailureReason.InvalidRegistrationInput,
    });
  });

  it('denies non-string gender input instead of throwing an unexpected error', async () => {
    const users = fakeUsers();
    users.findByEmail = jest.fn(() => Promise.resolve(null));
    const useCase = new RegisterUseCase(users, fakeHasher(true), fakeAudit());

    await expect(
      useCase.execute({
        email: 'bad@example.com',
        password: 'Password123!',
        firstname: 'Bad',
        lastname: 'Input',
        gender: true,
        dataofbirth: '2001-04-12',
      }),
    ).rejects.toMatchObject({
      reason: AuthFailureReason.InvalidRegistrationInput,
    });

    expect(users.createdStudents).toEqual([]);
  });
});

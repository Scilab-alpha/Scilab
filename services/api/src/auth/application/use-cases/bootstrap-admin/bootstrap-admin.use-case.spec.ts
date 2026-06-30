import { BootstrapAdminUseCase } from '@/auth/application/use-cases/bootstrap-admin/bootstrap-admin.use-case';
import { fakeHasher, fakeUsers } from '@/auth/application/testing/test-doubles';

describe('BootstrapAdminUseCase', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates or updates the env admin account', async () => {
    process.env = {
      ...originalEnv,
      ADMIN_EMAIL: 'Admin@admin.com',
      ADMIN_PASSWORD: '12345678',
    };
    const users = fakeUsers();
    const useCase = new BootstrapAdminUseCase(users, fakeHasher(true));

    await useCase.execute();

    expect(users.ensuredAdmins).toEqual([
      {
        email: 'admin@admin.com',
        passwordHash: 'hash:12345678',
      },
    ]);
  });

  it('skips bootstrap when admin env is missing', async () => {
    process.env = { ...originalEnv, ADMIN_EMAIL: '', ADMIN_PASSWORD: '' };
    const users = fakeUsers();
    const useCase = new BootstrapAdminUseCase(users, fakeHasher(true));

    await useCase.execute();

    expect(users.ensuredAdmins).toEqual([]);
  });
});

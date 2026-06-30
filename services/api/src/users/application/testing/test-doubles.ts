import {
  CreateUserData,
  UserManagementRepository,
  UserRecord,
  UpdateUserData,
} from '@/users/application/ports/user.ports';

export function userRecord(override: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'user-1',
    email: 'user@example.com',
    type: 'EMAIL',
    status: 'ACTIVE',
    role: 'STUDENT',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    dateOfBirth: new Date('2000-01-02T00:00:00.000Z'),
    gender: 'FEMALE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...override,
  };
}

export function fakeUsers(
  options: {
    existing?: UserRecord | null;
    duplicate?: UserRecord | null;
    records?: UserRecord[];
  } = {},
): UserManagementRepository & {
  created: CreateUserData[];
  updated: Array<{ id: string; data: UpdateUserData }>;
  deleted: string[];
} {
  const existing =
    options.existing === undefined ? userRecord() : options.existing;
  const duplicate = options.duplicate === undefined ? null : options.duplicate;
  const created: CreateUserData[] = [];
  const updated: Array<{ id: string; data: UpdateUserData }> = [];
  const deleted: string[] = [];

  return {
    created,
    updated,
    deleted,
    findMany: jest.fn(() => Promise.resolve(options.records ?? [userRecord()])),
    findById: jest.fn(() => Promise.resolve(existing)),
    findByEmail: jest.fn(() => Promise.resolve(duplicate)),
    create: jest.fn((data) => {
      created.push(data);
      return Promise.resolve(userRecord({ ...data, id: 'created-user-1' }));
    }),
    update: jest.fn((id, data) => {
      updated.push({ id, data });
      return Promise.resolve(userRecord({ ...data, id }));
    }),
    delete: jest.fn((id) => {
      deleted.push(id);
      return Promise.resolve();
    }),
  };
}

export function fakeHasher() {
  return {
    hash: jest.fn((plainText: string) => Promise.resolve(`hash:${plainText}`)),
  };
}

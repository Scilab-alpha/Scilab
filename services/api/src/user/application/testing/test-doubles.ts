import {
  UpdateUserProfileData,
  UserRecord,
  UserRepository,
  UserRole,
  UserStatus,
} from '@/user/application/ports/user.ports';

export function fakeUserRecord(override: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'user-1',
    email: 'user@example.com',
    status: 'ACTIVE',
    role: 'STUDENT',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    gender: 'MALE',
    dateOfBirth: new Date('2001-04-12T00:00:00.000Z'),
    ...override,
  };
}

export function fakeUserRepository(
  users: UserRecord[] = [fakeUserRecord()],
): UserRepository & {
  updatedProfiles: { userId: string; data: UpdateUserProfileData }[];
  updatedRoles: { userId: string; role: UserRole }[];
  updatedStatuses: { userId: string; status: UserStatus }[];
  deletedIds: string[];
} {
  const records = [...users];
  const updatedProfiles: { userId: string; data: UpdateUserProfileData }[] = [];
  const updatedRoles: { userId: string; role: UserRole }[] = [];
  const updatedStatuses: { userId: string; status: UserStatus }[] = [];
  const deletedIds: string[] = [];

  return {
    updatedProfiles,
    updatedRoles,
    updatedStatuses,
    deletedIds,
    findById: jest.fn((id: string) =>
      Promise.resolve(records.find((user) => user.id === id) ?? null),
    ),
    findByEmail: jest.fn((email: string) =>
      Promise.resolve(
        records.find((user) => user.email.toLowerCase() === email) ?? null,
      ),
    ),
    list: jest.fn(() => Promise.resolve(records)),
    updateProfile: jest.fn((userId: string, data: UpdateUserProfileData) => {
      updatedProfiles.push({ userId, data });
      const user = records.find((record) => record.id === userId);
      return Promise.resolve(user ? { ...user, ...data } : null);
    }),
    updateRole: jest.fn((userId: string, role: UserRole) => {
      updatedRoles.push({ userId, role });
      const user = records.find((record) => record.id === userId);
      return Promise.resolve(user ? { ...user, role } : null);
    }),
    updateStatus: jest.fn((userId: string, status: UserStatus) => {
      updatedStatuses.push({ userId, status });
      const user = records.find((record) => record.id === userId);
      return Promise.resolve(user ? { ...user, status } : null);
    }),
    deleteById: jest.fn((userId: string) => {
      deletedIds.push(userId);
      return Promise.resolve(records.some((user) => user.id === userId));
    }),
  };
}

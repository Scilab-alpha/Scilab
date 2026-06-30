import {
  fakeUsers,
  userRecord,
} from '@/users/application/testing/test-doubles';
import { ListUsersUseCase } from './list-users.use-case';

describe('ListUsersUseCase', () => {
  it('returns all users for admin workflows', async () => {
    const useCase = new ListUsersUseCase(
      fakeUsers({
        records: [
          userRecord({ id: 'student-1', role: 'STUDENT' }),
          userRecord({ id: 'researcher-1', role: 'RESEARCHER' }),
        ],
      }),
    );

    await expect(useCase.execute()).resolves.toEqual([
      expect.objectContaining({ id: 'student-1' }),
      expect.objectContaining({ id: 'researcher-1' }),
    ]);
  });
});

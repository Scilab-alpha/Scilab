import { UserProfileOutput } from '@/user/application/use-cases/user-profile.mapper';

export interface ListUsersOutput {
  users: UserProfileOutput[];
}

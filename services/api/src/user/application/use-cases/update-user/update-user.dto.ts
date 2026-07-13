import { UserProfilePatchInput } from '@/user/application/use-cases/user-profile-input';

export interface UpdateUserInput {
  userId: string;
  data: UserProfilePatchInput;
}

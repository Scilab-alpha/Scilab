import { UserProfilePatchInput } from '@/user/application/use-cases/user-profile-input';

export interface UpdateCurrentUserInput {
  userId: string;
  data: UserProfilePatchInput;
}

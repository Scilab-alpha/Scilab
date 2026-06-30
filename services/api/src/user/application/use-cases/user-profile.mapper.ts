import { UserRecord } from '@/user/application/ports/user.ports';

export interface UserProfileOutput {
  id: string;
  email: string;
  status: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
}

export function toUserProfileOutput(user: UserRecord): UserProfileOutput {
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
  };
}

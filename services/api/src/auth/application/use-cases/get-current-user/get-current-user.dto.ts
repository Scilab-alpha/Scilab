import { AuthenticatedUser } from '@/auth/application/ports/auth.ports';

export interface GetCurrentUserInput {
  currentUser: AuthenticatedUser;
}

export type GetCurrentUserOutput = Omit<AuthenticatedUser, 'sessionId'>;

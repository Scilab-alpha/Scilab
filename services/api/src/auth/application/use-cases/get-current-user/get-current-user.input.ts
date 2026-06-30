import { AuthenticatedUser } from '@/auth/application/ports/auth.ports';

export type GetCurrentUserInput = AuthenticatedUser;
export type CurrentUserResult = Omit<AuthenticatedUser, 'sessionId'>;

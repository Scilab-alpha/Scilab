import { AuthFailureReason } from '@/auth/domain/auth.errors';

export enum AuthEventType {
  SignInSuccess = 'SIGN_IN_SUCCESS',
  SignInFailure = 'SIGN_IN_FAILURE',
  RegisterSuccess = 'REGISTER_SUCCESS',
  RegisterFailure = 'REGISTER_FAILURE',
  TokenRefreshSuccess = 'TOKEN_REFRESH_SUCCESS',
  TokenRefreshFailure = 'TOKEN_REFRESH_FAILURE',
  TokenDenied = 'TOKEN_DENIED',
  SignOut = 'SIGN_OUT',
}

export interface AuthEvent {
  type: AuthEventType;
  occurredAt: Date;
  userId?: string;
  email?: string;
  reason?: AuthFailureReason;
}

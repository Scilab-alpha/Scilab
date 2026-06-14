export interface AuthSessionProps {
  id: string;
  userId: string;
  accessTokenIdHash: string;
  refreshTokenHash: string;
  issuedAt: Date;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt?: Date | null;
  rotatedAt?: Date | null;
}

export class AuthSession {
  constructor(private readonly props: AuthSessionProps) {}

  get id() {
    return this.props.id;
  }

  get userId() {
    return this.props.userId;
  }

  isRevoked() {
    return this.props.revokedAt !== null;
  }

  canUseAccessToken(now = new Date()) {
    return !this.isRevoked() && this.props.accessTokenExpiresAt > now;
  }

  canUseRefreshToken(now = new Date()) {
    return !this.isRevoked() && this.props.refreshTokenExpiresAt > now;
  }
}

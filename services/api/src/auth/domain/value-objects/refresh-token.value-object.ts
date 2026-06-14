import { createHash, randomBytes } from 'crypto';

export class RefreshToken {
  private constructor(public readonly value: string) {}

  static generate() {
    return new RefreshToken(randomBytes(48).toString('base64url'));
  }

  static fromRaw(value: string) {
    if (!value || value.trim().length < 16) {
      return null;
    }

    return new RefreshToken(value);
  }

  hash() {
    return createHash('sha256').update(this.value).digest('hex');
  }
}

import { Injectable } from '@nestjs/common';
import { hash, verify } from 'argon2';
import { PasswordHasher } from '@/auth/application/ports/auth.ports';

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  async verify(hashValue: string, plainText: string): Promise<boolean> {
    try {
      return await verify(hashValue, plainText);
    } catch {
      return false;
    }
  }

  hash(plainText: string): Promise<string> {
    return hash(plainText);
  }
}

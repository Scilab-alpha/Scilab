import {
  AuthEventLogger,
  PasswordHasher,
  UserRepository,
} from '@/auth/application/ports/auth.ports';
import { AuthEventType } from '@/auth/domain/auth-event';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';
import { RegisterInput } from './register.input';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER'] as const;

export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly audit: AuthEventLogger,
    private readonly reservedAdminEmail?: string,
  ) {}

  async execute(input: RegisterInput): Promise<void> {
    const email = input.email?.trim().toLowerCase();
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();
    const dateOfBirth = this.parseDateOfBirth(input.dateOfBirth);
    const gender = this.normalizeGender(input.gender);

    if (
      !this.isValidEmail(email) ||
      !this.isValidPassword(input.password) ||
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !gender
    ) {
      await this.auditFailure(email, AuthFailureReason.InvalidRegistration);
      throw new AuthUseCaseError(
        AuthFailureReason.InvalidRegistration,
        'Registration input is invalid',
      );
    }

    if (email === this.normalizeEmail(this.reservedAdminEmail)) {
      await this.auditFailure(email, AuthFailureReason.ReservedAdminEmail);
      throw new AuthUseCaseError(
        AuthFailureReason.ReservedAdminEmail,
        'Admin account cannot be registered',
      );
    }

    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      await this.auditFailure(email, AuthFailureReason.EmailAlreadyExists);
      throw new AuthUseCaseError(
        AuthFailureReason.EmailAlreadyExists,
        'Email is already registered',
      );
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({
      email,
      password: passwordHash,
      type: 'EMAIL',
      status: 'ACTIVE',
      role: 'STUDENT',
      firstName,
      lastName,
      dateOfBirth,
      gender,
    });

    await this.audit.record({
      type: AuthEventType.RegisterSuccess,
      occurredAt: new Date(),
      userId: user.id,
      email,
    });
  }

  private isValidEmail(email: string | undefined): email is string {
    return Boolean(email && EMAIL_PATTERN.test(email));
  }

  private normalizeEmail(email: string | undefined): string | undefined {
    return email?.trim().toLowerCase() || undefined;
  }

  private isValidPassword(password: string | undefined): password is string {
    return Boolean(password && password.length >= 8);
  }

  private parseDateOfBirth(value: string | undefined): Date | null {
    if (!value || !DATE_PATTERN.test(value)) {
      return null;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().slice(0, 10) === value ? date : null;
  }

  private normalizeGender(value: string | undefined): string | null {
    const gender = value?.trim().toUpperCase();
    if (!gender) {
      return null;
    }

    return GENDER_VALUES.some((allowed) => allowed === gender) ? gender : null;
  }

  private async auditFailure(
    email: string | undefined,
    reason: AuthFailureReason,
  ) {
    await this.audit.record({
      type: AuthEventType.RegisterFailure,
      occurredAt: new Date(),
      email,
      reason,
    });
  }
}

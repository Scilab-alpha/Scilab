import {
  AuthEventLogger,
  Gender,
  PasswordHasher,
  UserRegistrationRecord,
  UserRepository,
} from '@/auth/application/ports/auth.ports';
import { RegisterInput } from '@/auth/application/use-cases/register/register.dto';
import { AuthEventType } from '@/auth/domain/auth-event';
import { AuthFailureReason, AuthUseCaseError } from '@/auth/domain/auth.errors';

const GENDERS = new Set<Gender>(['MALE', 'FEMALE', 'OTHER']);

export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly audit: AuthEventLogger,
  ) {}

  async execute(input: RegisterInput): Promise<UserRegistrationRecord> {
    const email = this.parseEmail(input.email);
    const password = this.parseRequiredString(input.password);
    const firstName = this.parseRequiredString(input.firstname);
    const lastName = this.parseRequiredString(input.lastname);
    const gender = this.parseGender(input.gender);
    const dateOfBirth = this.parseDateOfBirth(input.dataofbirth);

    if (
      !email ||
      !password ||
      password.length < 8 ||
      !firstName ||
      !lastName ||
      !gender ||
      !dateOfBirth
    ) {
      await this.auditFailure(
        email,
        AuthFailureReason.InvalidRegistrationInput,
      );
      throw new AuthUseCaseError(
        AuthFailureReason.InvalidRegistrationInput,
        'Registration input is invalid',
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (adminEmail && email === adminEmail) {
      await this.auditFailure(email, AuthFailureReason.EmailAlreadyRegistered);
      throw new AuthUseCaseError(
        AuthFailureReason.EmailAlreadyRegistered,
        'Email is already registered',
      );
    }

    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      await this.auditFailure(email, AuthFailureReason.EmailAlreadyRegistered);
      throw new AuthUseCaseError(
        AuthFailureReason.EmailAlreadyRegistered,
        'Email is already registered',
      );
    }

    const user = await this.users.createStudent({
      email,
      passwordHash: await this.passwordHasher.hash(password),
      firstName,
      lastName,
      gender,
      dateOfBirth,
    });

    await this.audit.record({
      type: AuthEventType.RegisterSuccess,
      occurredAt: new Date(),
      userId: user.id,
      email,
    });

    return user;
  }

  private parseEmail(value: unknown): string | null {
    const email = this.parseRequiredString(value)?.toLowerCase();
    return email || null;
  }

  private parseRequiredString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const parsed = value.trim();
    return parsed || null;
  }

  private parseGender(value: unknown): Gender | null {
    const normalized = this.parseRequiredString(value)?.toUpperCase() as
      | Gender
      | undefined;

    if (!normalized || !GENDERS.has(normalized)) {
      return null;
    }

    return normalized;
  }

  private parseDateOfBirth(value: unknown) {
    const date = this.parseRequiredString(value);

    if (!date) {
      return null;
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private async auditFailure(email: string | null, reason: AuthFailureReason) {
    await this.audit.record({
      type: AuthEventType.RegisterFailure,
      occurredAt: new Date(),
      email: email ?? undefined,
      reason,
    });
  }
}

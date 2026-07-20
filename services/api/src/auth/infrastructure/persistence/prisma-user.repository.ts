import { Injectable } from '@nestjs/common';
import {
  AuthProvider,
  Gender,
  RoleAccount,
  StatusAccount,
} from '@prisma/client';
import {
  CreateAdminInput,
  CreateUserInput,
  UserAuthRecord,
  UserRepository,
  UserRegistrationRecord,
} from '@/auth/application/ports/auth.ports';
import { PrismaService } from '@repo/database';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    return user ? this.toRecord(user) : null;
  }

  async findById(id: string): Promise<UserAuthRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toRecord(user) : null;
  }

  async createStudent(input: CreateUserInput): Promise<UserRegistrationRecord> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: input.passwordHash,
        type: AuthProvider.EMAIL,
        status: StatusAccount.ACTIVE,
        role: RoleAccount.STUDENT,
        firstName: input.firstName,
        lastName: input.lastName,
        gender: input.gender,
        dateOfBirth: input.dateOfBirth,
      },
    });

    return this.toRegistrationRecord(user);
  }

  async ensureAdmin(input: CreateAdminInput): Promise<UserAuthRecord> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: input.email,
          mode: 'insensitive',
        },
      },
    });

    const adminData = {
      email: input.email,
      password: input.passwordHash,
      type: AuthProvider.EMAIL,
      status: StatusAccount.ACTIVE,
      role: RoleAccount.ADMIN,
    };

    const user = existingUser
      ? await this.prisma.user.update({
          where: { id: existingUser.id },
          data: adminData,
        })
      : await this.prisma.user.create({
          data: {
            ...adminData,
            firstName: 'System',
            lastName: 'Admin',
          },
        });

    return this.toRecord(user);
  }

  private toRecord(user: {
    id: string;
    email: string;
    password: string;
    status: unknown;
    role: unknown;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  }): UserAuthRecord {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      status: String(user.status),
      role: String(user.role),
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    };
  }

  private toRegistrationRecord(user: {
    id: string;
    email: string;
    status: unknown;
    role: unknown;
    firstName: string | null;
    lastName: string | null;
    gender: Gender | null;
    dateOfBirth: Date | null;
  }): UserRegistrationRecord {
    return {
      id: user.id,
      email: user.email,
      status: String(user.status),
      role: String(user.role),
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
    };
  }
}

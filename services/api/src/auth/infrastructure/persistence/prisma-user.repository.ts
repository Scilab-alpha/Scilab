import { Injectable } from '@nestjs/common';
import {
  CreateUserInput,
  UserAuthRecord,
  UserRepository,
} from '@/auth/application/ports/auth.ports';
import { PrismaService } from '@/prisma/prisma.service';
import {
  AuthProvider,
  Gender,
  RoleAccount,
  StatusAccount,
} from '@prisma/client';

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

  async create(input: CreateUserInput): Promise<UserAuthRecord> {
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: input.password,
        type: input.type as AuthProvider,
        status: input.status as StatusAccount,
        role: input.role as RoleAccount,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender as Gender,
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
}

import { Injectable } from '@nestjs/common';
import {
  UserAuthRecord,
  UserRepository,
} from '@/auth/application/ports/auth.ports';
import { PrismaService } from '@/prisma/prisma.service';

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

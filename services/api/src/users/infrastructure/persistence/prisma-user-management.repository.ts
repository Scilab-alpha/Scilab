import { Injectable } from '@nestjs/common';
import {
  CreateUserData,
  UpdateUserData,
  UserManagementRepository,
  UserRecord,
} from '@/users/application/ports/user.ports';
import { PrismaService } from '@/prisma/prisma.service';
import {
  AuthProvider,
  Gender,
  RoleAccount,
  StatusAccount,
} from '@prisma/client';

@Injectable()
export class PrismaUserManagementRepository implements UserManagementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(): Promise<UserRecord[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.toRecord(user));
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toRecord(user) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
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

  async create(data: CreateUserData): Promise<UserRecord> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        type: data.type as AuthProvider,
        status: data.status as StatusAccount,
        role: data.role as RoleAccount,
        firstName: data.firstName,
        lastName: data.lastName,
        imageUrl: data.imageUrl,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as Gender,
      },
    });
    return this.toRecord(user);
  }

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        type: data.type as AuthProvider,
        status: data.status as StatusAccount,
        role: data.role as RoleAccount,
        firstName: data.firstName,
        lastName: data.lastName,
        imageUrl: data.imageUrl,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as Gender,
      },
    });
    return this.toRecord(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toRecord(user: {
    id: string;
    email: string;
    type: string;
    status: string;
    role: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserRecord {
    return {
      id: user.id,
      email: user.email,
      type: String(user.type),
      status: String(user.status),
      role: String(user.role),
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

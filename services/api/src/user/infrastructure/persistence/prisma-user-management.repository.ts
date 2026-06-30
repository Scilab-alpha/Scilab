import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import {
  UpdateUserProfileData,
  UserRecord,
  UserRepository,
  UserRole,
  UserStatus,
} from '@/user/application/ports/user.ports';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PrismaUserManagementRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async list(): Promise<UserRecord[]> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ email: 'asc' }],
    });

    return users.map((user) => this.toRecord(user));
  }

  async updateProfile(
    userId: string,
    data: UpdateUserProfileData,
  ): Promise<UserRecord | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
        },
      });

      return this.toRecord(user);
    } catch (error) {
      if (this.isMissingRecord(error)) {
        return null;
      }

      throw error;
    }
  }

  async updateRole(userId: string, role: UserRole): Promise<UserRecord | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      return this.toRecord(user);
    } catch (error) {
      if (this.isMissingRecord(error)) {
        return null;
      }

      throw error;
    }
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<UserRecord | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { status },
      });

      return this.toRecord(user);
    } catch (error) {
      if (this.isMissingRecord(error)) {
        return null;
      }

      throw error;
    }
  }

  async deleteById(userId: string): Promise<boolean> {
    try {
      await this.prisma.user.delete({ where: { id: userId } });
      return true;
    } catch (error) {
      if (this.isMissingRecord(error)) {
        return false;
      }

      throw error;
    }
  }

  private toRecord(user: User): UserRecord {
    return {
      id: user.id,
      email: user.email,
      status: String(user.status) as UserStatus,
      role: String(user.role) as UserRole,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
    };
  }

  private isMissingRecord(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}

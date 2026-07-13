export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';
export type UserRole = 'STUDENT' | 'RESEARCHER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface UserRecord {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  gender: UserGender | null;
  dateOfBirth: Date | null;
}

export interface UpdateUserProfileData {
  email?: string;
  firstName?: string;
  lastName?: string;
  gender?: UserGender;
  dateOfBirth?: Date;
}

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  list(): Promise<UserRecord[]>;
  updateProfile(
    userId: string,
    data: UpdateUserProfileData,
  ): Promise<UserRecord | null>;
  updateRole(userId: string, role: UserRole): Promise<UserRecord | null>;
  updateStatus(userId: string, status: UserStatus): Promise<UserRecord | null>;
  deleteById(userId: string): Promise<boolean>;
}

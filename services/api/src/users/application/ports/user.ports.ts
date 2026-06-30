export interface UserRecord {
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
}

export interface CreateUserData {
  email: string;
  password: string;
  type: string;
  status: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
}

export interface UpdateUserData {
  email?: string;
  type?: string;
  status?: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
}

export interface UserManagementRepository {
  findMany(): Promise<UserRecord[]>;
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: CreateUserData): Promise<UserRecord>;
  update(id: string, data: UpdateUserData): Promise<UserRecord>;
  delete(id: string): Promise<void>;
}

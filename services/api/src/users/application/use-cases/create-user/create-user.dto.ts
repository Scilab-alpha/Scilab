export interface CreateUserInput {
  email?: string;
  password?: string;
  type?: string;
  status?: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
}

import type { AuthRole } from "@/features/auth/types";

export type ProfileGender = "FEMALE" | "MALE" | "OTHER";

export type UserProfile = {
  dateOfBirth: string | null;
  email: string;
  firstName: string | null;
  gender: ProfileGender | null;
  id: string;
  imageUrl: string | null;
  lastName: string | null;
  role: AuthRole;
  status: string;
};

export type UpdateProfilePayload = {
  dateofbirth?: string;
  firstname: string;
  gender?: ProfileGender;
  lastname: string;
};

export type ProfileFormValues = {
  dateOfBirth: string;
  firstName: string;
  gender: ProfileGender | "";
  lastName: string;
};

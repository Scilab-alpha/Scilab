import type {
  ApiUpdateUserProfileInput,
  ApiUserProfile,
  ApiUserRole,
  ApiUserStatus,
  UpdateUserProfileInput,
  UserProfile,
  UserRole,
  UserStatus,
} from "@/features/users/types/user.types";

const ROLE_MAP: Record<ApiUserRole, UserRole> = {
  STUDENT: "student",
  RESEARCHER: "researcher",
  ADMIN: "admin",
};

const STATUS_MAP: Record<ApiUserStatus, UserStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  BANNED: "banned",
};

export function mapApiUserProfile(user: ApiUserProfile): UserProfile {
  const firstName = normalizeNullableText(user.firstName);
  const lastName = normalizeNullableText(user.lastName);
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    user.email.split("@")[0] ||
    "SciLab User";

  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    displayName,
    initials: getInitials(displayName),
    imageUrl: user.imageUrl,
    gender: user.gender,
    dateOfBirth: toDateOnly(user.dateOfBirth),
    role: ROLE_MAP[user.role],
    status: STATUS_MAP[user.status],
  };
}

export function toApiUserUpdate(
  input: UpdateUserProfileInput,
): ApiUpdateUserProfileInput {
  const request: ApiUpdateUserProfileInput = {};

  if (input.email !== undefined) {
    request.email = input.email.trim().toLowerCase();
  }
  if (input.firstName !== undefined) {
    request.firstname = input.firstName.trim();
  }
  if (input.lastName !== undefined) {
    request.lastname = input.lastName.trim();
  }
  if (input.gender !== undefined) {
    request.gender = input.gender;
  }
  if (input.dateOfBirth !== undefined) {
    request.dateofbirth = input.dateOfBirth;
  }

  return request;
}

export function toApiUserRole(
  role: Exclude<UserRole, "admin">,
): Exclude<ApiUserRole, "ADMIN"> {
  return role === "researcher" ? "RESEARCHER" : "STUDENT";
}

export function toApiUserStatus(status: UserStatus): ApiUserStatus {
  return status.toUpperCase() as ApiUserStatus;
}

function normalizeNullableText(value: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

function toDateOnly(value: string | null) {
  return value ? value.slice(0, 10) : null;
}

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

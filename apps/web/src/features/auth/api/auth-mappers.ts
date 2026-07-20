import type { AuthUser, UserRole } from "@/features/auth/types/auth.types";

interface ApiUserLike {
  id?: string;
  userId?: string;
  email?: string;
  status?: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
}

export function mapApiRole(role: string | null | undefined): UserRole {
  const normalized = role?.trim().toLowerCase();

  if (normalized === "admin" || normalized === "system_admin") {
    return "admin";
  }

  if (normalized === "researcher") {
    return "researcher";
  }

  return "student";
}

export function mapApiUser(user: ApiUserLike): AuthUser {
  const firstName = user.firstName ?? "";
  const lastName = user.lastName ?? "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    user.email?.split("@")[0] ||
    "Scilab User";

  return {
    id: user.id ?? user.userId ?? user.email ?? "current-user",
    email: user.email ?? "",
    status: user.status ?? "UNKNOWN",
    role: mapApiRole(user.role),
    firstName,
    lastName,
    name: displayName,
    displayName,
    imageUrl: user.imageUrl ?? null,
    gender: mapApiGender(user.gender),
    dateOfBirth: user.dateOfBirth ?? null,
    initials: getInitials(displayName),
  };
}

function mapApiGender(gender: string | null | undefined): AuthUser["gender"] {
  const normalized = gender?.trim().toUpperCase();
  return normalized === "MALE" ||
    normalized === "FEMALE" ||
    normalized === "OTHER"
    ? normalized
    : null;
}

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

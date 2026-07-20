import type {
  AdminUserRole,
  AdminUserStatus,
  ApiUserProfile,
  ApiUserStatus,
  PatchableApiRole,
  User,
} from "@/features/users/types/user.types";

export function mapApiRoleToUi(role: ApiUserProfile["role"]): AdminUserRole {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "RESEARCHER":
      return "researcher";
    default:
      return "reader";
  }
}

export function mapUiRoleToApi(role: AdminUserRole): PatchableApiRole | null {
  if (role === "researcher") return "RESEARCHER";
  if (role === "reader") return "STUDENT";
  return null;
}

export function mapApiStatusToUi(
  status: ApiUserProfile["status"],
): AdminUserStatus {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "INACTIVE":
      return "inactive";
    case "BANNED":
      return "suspended";
  }
}

export function mapUiStatusToApi(status: AdminUserStatus): ApiUserStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "inactive":
      return "INACTIVE";
    case "suspended":
      return "BANNED";
  }
}

export function mapApiUserToUi(user: ApiUserProfile): User {
  const firstName = user.firstName?.trim() || "";
  const lastName = user.lastName?.trim() || "";
  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || user.email;

  return {
    id: user.id,
    email: user.email,
    displayName,
    role: mapApiRoleToUi(user.role),
    status: mapApiStatusToUi(user.status),
    registrationDate: user.dateOfBirth ?? new Date().toISOString(),
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

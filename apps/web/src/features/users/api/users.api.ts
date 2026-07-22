import { apiRequest } from "@/core/api";
import { mapApiUserToUi } from "@/features/users/api/user-mappers";
import type {
  AdminUserRole,
  AdminUserStatus,
  ApiUserListResponse,
  ApiUserProfile,
  User,
} from "@/features/users/types/user.types";
import {
  mapUiRoleToApi,
  mapUiStatusToApi,
} from "@/features/users/api/user-mappers";

/** GET /users (admin). */
export async function listAdminUsers(): Promise<User[]> {
  const page = await apiRequest<ApiUserListResponse>({
    authenticated: true,
    method: "GET",
    path: "/users",
  });
  return page.users.map(mapApiUserToUi);
}

/** PATCH /users/:id/role */
export async function updateAdminUserRole(
  userId: string,
  role: AdminUserRole,
): Promise<User> {
  const apiRole = mapUiRoleToApi(role);
  if (!apiRole) {
    throw new Error("Admin role cannot be assigned from this screen.");
  }

  const updated = await apiRequest<ApiUserProfile>({
    authenticated: true,
    method: "PATCH",
    path: `/users/${encodeURIComponent(userId)}/role`,
    body: { role: apiRole },
  });
  return mapApiUserToUi(updated);
}

/** PATCH /users/:id/status */
export async function updateAdminUserStatus(
  userId: string,
  status: AdminUserStatus,
): Promise<User> {
  const updated = await apiRequest<ApiUserProfile>({
    authenticated: true,
    method: "PATCH",
    path: `/users/${encodeURIComponent(userId)}/status`,
    body: { status: mapUiStatusToApi(status) },
  });
  return mapApiUserToUi(updated);
}

/** DELETE /users/:id */
export async function deleteAdminUser(userId: string): Promise<void> {
  await apiRequest<Record<string, never>>({
    authenticated: true,
    method: "DELETE",
    path: `/users/${encodeURIComponent(userId)}`,
  });
}

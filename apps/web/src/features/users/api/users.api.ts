import { apiRequest } from "@/shared/api/http-client";
import {
  mapApiUserProfile,
  toApiUserRole,
  toApiUserStatus,
  toApiUserUpdate,
} from "@/features/users/api/user-mappers";
import type {
  ApiUserList,
  ApiUserProfile,
  UpdateUserProfileInput,
  UserProfile,
  UserRole,
  UserStatus,
} from "@/features/users/types/user.types";

export { USER_QUERY_KEYS } from "./user-query-keys";

export async function getMyProfile(): Promise<UserProfile> {
  const user = await apiRequest<ApiUserProfile>({
    method: "GET",
    url: "/users/me",
  });
  return mapApiUserProfile(user);
}

export async function updateMyProfile(
  patch: UpdateUserProfileInput,
): Promise<UserProfile> {
  const user = await apiRequest<ApiUserProfile>({
    method: "PATCH",
    url: "/users/me",
    data: toApiUserUpdate(patch),
  });
  return mapApiUserProfile(user);
}

export async function listUsers(): Promise<UserProfile[]> {
  const result = await apiRequest<ApiUserList>({
    method: "GET",
    url: "/users",
  });
  return result.users.map(mapApiUserProfile);
}

export async function getUserById(userId: string): Promise<UserProfile> {
  const user = await apiRequest<ApiUserProfile>({
    method: "GET",
    url: `/users/${encodeURIComponent(userId)}`,
  });
  return mapApiUserProfile(user);
}

export async function updateUser(
  userId: string,
  patch: UpdateUserProfileInput,
): Promise<UserProfile> {
  const user = await apiRequest<ApiUserProfile>({
    method: "PATCH",
    url: `/users/${encodeURIComponent(userId)}`,
    data: toApiUserUpdate(patch),
  });
  return mapApiUserProfile(user);
}

export async function updateUserRole(
  userId: string,
  role: Exclude<UserRole, "admin">,
): Promise<UserProfile> {
  const user = await apiRequest<ApiUserProfile>({
    method: "PATCH",
    url: `/users/${encodeURIComponent(userId)}/role`,
    data: { role: toApiUserRole(role) },
  });
  return mapApiUserProfile(user);
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
): Promise<UserProfile> {
  const user = await apiRequest<ApiUserProfile>({
    method: "PATCH",
    url: `/users/${encodeURIComponent(userId)}/status`,
    data: { status: toApiUserStatus(status) },
  });
  return mapApiUserProfile(user);
}

export async function deleteUser(userId: string): Promise<void> {
  await apiRequest<Record<string, never>>({
    method: "DELETE",
    url: `/users/${encodeURIComponent(userId)}`,
  });
}

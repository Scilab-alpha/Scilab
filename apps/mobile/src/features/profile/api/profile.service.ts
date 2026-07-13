import { apiRequest } from "@/services/api";

import type {
  UpdateProfilePayload,
  UserProfile,
} from "@/features/profile/types/profile.type";

export function getMyProfile(signal?: AbortSignal) {
  return apiRequest<UserProfile>({
    authenticated: true,
    method: "GET",
    path: "/users/me",
    signal,
  });
}

export function updateMyProfile(payload: UpdateProfilePayload) {
  return apiRequest<UserProfile>({
    authenticated: true,
    body: payload,
    method: "PATCH",
    path: "/users/me",
  });
}

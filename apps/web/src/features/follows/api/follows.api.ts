import { apiRequest } from "@/core/api";
import type {
  FollowListParams,
  FollowListResponse,
  FollowObjectType,
  NotifyMode,
  ToggleFollowRequest,
  ToggleFollowResponse,
  UpdateFollowNotifyModeRequest,
  UpdateFollowNotifyModeResponse,
} from "@/features/follows/types/follow.types";

const defaultLimit = 20;

function buildQuery(params: FollowListParams = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? defaultLimit),
  });

  if (params.objectType) {
    query.set("objectType", params.objectType);
  }

  return query.toString();
}

/** GET /follows */
export function listFollows(
  params: FollowListParams = {},
): Promise<FollowListResponse> {
  return apiRequest<FollowListResponse>({
    authenticated: true,
    method: "GET",
    path: `/follows?${buildQuery(params)}`,
  });
}

/** POST /follows/toggle */
export function toggleFollow(
  body: ToggleFollowRequest,
): Promise<ToggleFollowResponse> {
  return apiRequest<ToggleFollowResponse>({
    authenticated: true,
    method: "POST",
    path: "/follows/toggle",
    body,
  });
}

/** PATCH /follows/:objectType/:objectId */
export function updateFollowNotifyMode(
  objectType: FollowObjectType,
  objectId: string,
  body: UpdateFollowNotifyModeRequest,
): Promise<UpdateFollowNotifyModeResponse> {
  return apiRequest<UpdateFollowNotifyModeResponse>({
    authenticated: true,
    method: "PATCH",
    path: `/follows/${encodeURIComponent(objectType)}/${encodeURIComponent(objectId)}`,
    body,
  });
}

/** Helper when UI only needs to change notify mode. */
export function setFollowNotifyMode(
  objectType: FollowObjectType,
  objectId: string,
  notifyMode: NotifyMode,
) {
  return updateFollowNotifyMode(objectType, objectId, { notifyMode });
}

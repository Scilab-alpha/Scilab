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

export function buildFollowQuery(params: FollowListParams = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? defaultLimit),
  });

  if (params.type) query.set("type", params.type);
  return query.toString();
}

/** GET /follows from the authenticated backend. */
export function listFollows(
  params: FollowListParams = {},
): Promise<FollowListResponse> {
  return apiRequest<FollowListResponse>({
    authenticated: true,
    method: "GET",
    path: `/follows?${buildFollowQuery(params)}`,
  });
}

/** POST /follows/toggle for academic graph target ids. */
export function toggleFollow(
  body: ToggleFollowRequest,
): Promise<ToggleFollowResponse> {
  return apiRequest<ToggleFollowResponse>({
    authenticated: true,
    method: "POST",
    path: "/follows/toggle",
    body: {
      objectType: body.objectType,
      objectId: body.objectId.trim(),
      notifyMode: body.notifyMode,
    },
  });
}

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

export function setFollowNotifyMode(
  objectType: FollowObjectType,
  objectId: string,
  notifyMode: NotifyMode,
) {
  return updateFollowNotifyMode(objectType, objectId, { notifyMode });
}

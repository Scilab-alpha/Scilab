import { apiRequest } from "@/services/api";

import type {
  FollowListParams,
  FollowPage,
  ToggleFollowInput,
  ToggleFollowResult,
  UpdateFollowNotifyModeInput,
  UpdateFollowNotifyModeResult,
} from "@/features/follows/types/follow.type";

const defaultLimit = 20;

export function listFollows({
  limit = defaultLimit,
  page = 1,
  type,
}: FollowListParams = {}) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  if (type) {
    params.set("type", type);
  }

  return apiRequest<FollowPage>({
    authenticated: true,
    method: "GET",
    path: `/follows?${params.toString()}`,
  });
}

export function toggleFollow(input: ToggleFollowInput) {
  return apiRequest<ToggleFollowResult>({
    authenticated: true,
    body: input,
    method: "POST",
    path: "/follows/toggle",
  });
}

export function updateFollowNotifyMode({
  notifyMode,
  objectId,
  objectType,
}: UpdateFollowNotifyModeInput) {
  return apiRequest<UpdateFollowNotifyModeResult>({
    authenticated: true,
    body: { notifyMode },
    method: "PATCH",
    path: `/follows/${encodeURIComponent(objectType)}/${encodeURIComponent(
      objectId,
    )}`,
  });
}

export async function getFollowStatus({
  objectId,
  objectType,
}: Pick<ToggleFollowInput, "objectId" | "objectType">) {
  const normalizedObjectId = objectId.trim();

  if (!normalizedObjectId) {
    return false;
  }

  let page = 1;
  const limit = 100;

  while (true) {
    const result = await listFollows({ limit, page, type: objectType });

    if (result.items.some((item) => item.objectId === normalizedObjectId)) {
      return true;
    }

    if (!result.hasMore) {
      return false;
    }

    page += 1;
  }
}

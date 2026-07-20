import { apiRequest } from "@/core/api";
import {
  isServerFollowableObjectId,
  listLocalFollows,
  toggleLocalFollow,
} from "@/features/follows/api/local-follows";
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
import { notifyFollowStarted } from "@/features/notifications/api/local-notifications";

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

async function listServerFollows(
  params: FollowListParams = {},
): Promise<FollowListResponse> {
  try {
    return await apiRequest<FollowListResponse>({
      authenticated: true,
      method: "GET",
      path: `/follows?${buildQuery(params)}`,
    });
  } catch {
    return {
      items: [],
      page: params.page ?? 1,
      limit: params.limit ?? defaultLimit,
      hasMore: false,
    };
  }
}

/** GET /follows (+ local follows for OpenAlex ids). */
export async function listFollows(
  params: FollowListParams = {},
): Promise<FollowListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? defaultLimit;
  const [server, local] = await Promise.all([
    listServerFollows(params),
    Promise.resolve(listLocalFollows(params.objectType)),
  ]);

  const seen = new Set(
    server.items.map((item) => `${item.objectType}:${item.objectId}`),
  );
  const merged = [
    ...server.items,
    ...local.filter((item) => !seen.has(`${item.objectType}:${item.objectId}`)),
  ];
  const start = (page - 1) * limit;

  return {
    items: merged.slice(start, start + limit),
    page,
    limit,
    hasMore: start + limit < merged.length || server.hasMore,
  };
}

export type ToggleFollowInput = ToggleFollowRequest & {
  displayName?: string | null;
};

/**
 * POST /follows/toggle for UUID ids.
 * OpenAlex ids are stored locally because public API requires uuid objectId.
 */
export async function toggleFollow(
  body: ToggleFollowInput,
): Promise<ToggleFollowResponse> {
  const objectId = body.objectId.trim();

  if (!isServerFollowableObjectId(objectId)) {
    const result = toggleLocalFollow({
      objectType: body.objectType,
      objectId,
      displayName: body.displayName,
      notifyMode: body.notifyMode,
    });

    if (result.followed) {
      notifyFollowStarted({
        objectType: body.objectType,
        objectId,
        displayName: body.displayName?.trim() || objectId,
      });
    }

    return result;
  }

  try {
    return await apiRequest<ToggleFollowResponse>({
      authenticated: true,
      method: "POST",
      path: "/follows/toggle",
      body: {
        objectType: body.objectType,
        objectId,
        notifyMode: body.notifyMode,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/objectId is invalid/i.test(message)) {
      const result = toggleLocalFollow({
        objectType: body.objectType,
        objectId,
        displayName: body.displayName,
        notifyMode: body.notifyMode,
      });
      if (result.followed) {
        notifyFollowStarted({
          objectType: body.objectType,
          objectId,
          displayName: body.displayName?.trim() || objectId,
        });
      }
      return result;
    }
    throw error;
  }
}

export async function updateFollowNotifyMode(
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

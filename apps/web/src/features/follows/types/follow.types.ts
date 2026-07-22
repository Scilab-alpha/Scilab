import type { PageParams, PageResult } from "@/core/api/pagination";

export type FollowObjectType = "JOURNAL" | "KEYWORD" | "TOPIC";

export type NotifyMode = "IN_APP" | "DAILY_EMAIL" | "WEEKLY_EMAIL" | "OFF";

export type FollowTarget = {
  type: FollowObjectType;
  id: string;
  displayName: string | null;
  sourceId?: string | null;
  journalType?: string | null;
};

/** Item from GET /follows */
export type FollowItem = {
  followId: string;
  objectType: FollowObjectType;
  objectId: string;
  notifyMode: NotifyMode;
  followedAt: string;
  target: FollowTarget;
};

export type FollowListParams = PageParams & {
  objectType?: FollowObjectType;
};

export type FollowListResponse = PageResult<FollowItem>;

export type ToggleFollowRequest = {
  objectType: FollowObjectType;
  objectId: string;
  notifyMode?: NotifyMode;
};

export type ToggleFollowResponse = {
  objectType: FollowObjectType;
  objectId: string;
  followed: boolean;
  notifyMode?: NotifyMode;
  followedAt?: string;
};

export type UpdateFollowNotifyModeRequest = {
  notifyMode: NotifyMode;
};

export type UpdateFollowNotifyModeResponse = {
  followId: string;
  objectType: FollowObjectType;
  objectId: string;
  notifyMode: NotifyMode;
  followedAt: string;
};

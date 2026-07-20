export type FollowObjectType = "JOURNAL" | "KEYWORD" | "TOPIC";

export type FollowNotifyMode =
  | "IN_APP"
  | "DAILY_EMAIL"
  | "WEEKLY_EMAIL"
  | "OFF";

export type FollowTarget = {
  country: string | null;
  displayName: string | null;
  id: string;
  journalType: string | null;
  region: string | null;
  score: number | null;
  sourceId: string | null;
  type: FollowObjectType;
};

export type FollowListItem = {
  followedAt: string;
  followId: string;
  notifyMode: FollowNotifyMode;
  objectId: string;
  objectType: FollowObjectType;
  target: FollowTarget;
};

export type FollowPage = {
  hasMore: boolean;
  items: FollowListItem[];
  limit: number;
  page: number;
};

export type FollowListParams = {
  limit?: number;
  page?: number;
  type?: FollowObjectType | null;
};

export type ToggleFollowInput = {
  notifyMode?: FollowNotifyMode;
  objectId: string;
  objectType: FollowObjectType;
};

export type ToggleFollowResult = {
  followed: boolean;
  followedAt?: string;
  notifyMode?: FollowNotifyMode;
  objectId: string;
  objectType: FollowObjectType;
};

export type UpdateFollowNotifyModeInput = {
  notifyMode: FollowNotifyMode;
  objectId: string;
  objectType: FollowObjectType;
};

export type UpdateFollowNotifyModeResult = {
  followedAt: string;
  followId: string;
  notifyMode: FollowNotifyMode;
  objectId: string;
  objectType: FollowObjectType;
};

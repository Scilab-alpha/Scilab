import {
  FollowNotifyMode,
  FollowObjectType,
} from '@/follow/application/ports/follow.ports';

export interface ToggleFollowInput {
  userId: string;
  objectType: unknown;
  objectId: unknown;
  notifyMode?: unknown;
}

export interface ToggleFollowOutput {
  objectType: FollowObjectType;
  objectId: string;
  followed: boolean;
  notifyMode?: FollowNotifyMode;
  followedAt?: Date;
}

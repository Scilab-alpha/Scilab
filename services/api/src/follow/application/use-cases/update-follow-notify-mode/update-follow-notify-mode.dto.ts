import {
  FollowNotifyMode,
  FollowObjectType,
} from '@/follow/application/ports/follow.ports';

export interface UpdateFollowNotifyModeInput {
  userId: string;
  objectType: unknown;
  objectId: unknown;
  notifyMode: unknown;
}

export interface UpdateFollowNotifyModeOutput {
  followId: string;
  objectType: FollowObjectType;
  objectId: string;
  notifyMode: FollowNotifyMode;
  followedAt: Date;
}

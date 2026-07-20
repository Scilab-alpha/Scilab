import { FollowTargetOutput } from '@repo/academic/domain';
import {
  FollowNotifyMode,
  FollowObjectType,
} from '@/follow/application/ports/follow.ports';

export interface ListFollowsInput {
  userId: string;
  type?: unknown;
  page?: unknown;
  limit?: unknown;
}

export interface FollowListItemOutput {
  followId: string;
  objectType: FollowObjectType;
  objectId: string;
  notifyMode: FollowNotifyMode;
  followedAt: Date;
  target: FollowTargetOutput;
}

export interface ListFollowsOutput {
  items: FollowListItemOutput[];
  page: number;
  limit: number;
  hasMore: boolean;
}

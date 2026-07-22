import {
  FollowableAcademicNodeType,
  FollowTargetReference,
} from '@repo/academic/domain';

export type FollowObjectType = FollowableAcademicNodeType;
export type FollowNotifyMode =
  | 'IN_APP'
  | 'DAILY_EMAIL'
  | 'WEEKLY_EMAIL'
  | 'OFF';

export interface FollowRecord {
  id: string;
  userId: string;
  objectType: FollowObjectType;
  objectId: string;
  notifyMode: FollowNotifyMode;
  createdAt: Date;
}

export interface FollowRecipient {
  userId: string;
  objectType: FollowObjectType;
  objectId: string;
  notifyMode: FollowNotifyMode;
}

export interface FollowRepository {
  countByUser(userId: string): Promise<number>;
  findByUserAndTarget(input: {
    userId: string;
    objectType: FollowObjectType;
    objectId: string;
  }): Promise<FollowRecord | null>;
  create(input: {
    userId: string;
    objectType: FollowObjectType;
    objectId: string;
    notifyMode: FollowNotifyMode;
  }): Promise<FollowRecord>;
  deleteByUserAndTarget(input: {
    userId: string;
    objectType: FollowObjectType;
    objectId: string;
  }): Promise<boolean>;
  updateNotifyMode(input: {
    userId: string;
    objectType: FollowObjectType;
    objectId: string;
    notifyMode: FollowNotifyMode;
  }): Promise<FollowRecord | null>;
  listByUser(input: {
    userId: string;
    objectType?: FollowObjectType;
    skip: number;
    take: number;
  }): Promise<FollowRecord[]>;
  listDistinctReferences(
    modes?: FollowNotifyMode[],
  ): Promise<FollowTargetReference[]>;
  listRecipientsForReferences(
    refs: FollowTargetReference[],
    modes?: FollowNotifyMode[],
  ): Promise<FollowRecipient[]>;
  deleteByReferences(refs: FollowTargetReference[]): Promise<number>;
}

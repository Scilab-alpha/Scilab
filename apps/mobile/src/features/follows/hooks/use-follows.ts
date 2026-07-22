import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";

import {
  getFollowStatus,
  listFollows,
} from "@/features/follows/api/follow.service";

import type {
  FollowObjectType,
  FollowPage,
} from "@/features/follows/types/follow.type";

const defaultPageSize = 20;

export const followsQueryKey = ["follows"] as const;

export function followListQueryKey(type?: FollowObjectType | null) {
  return type
    ? [...followsQueryKey, "list", type]
    : [...followsQueryKey, "list"];
}

export function followStatusQueryKey(
  objectType: FollowObjectType,
  objectId: string,
) {
  return [...followsQueryKey, "status", objectType, objectId] as const;
}

export function useFollows({
  limit = defaultPageSize,
  type = null,
}: {
  limit?: number;
  type?: FollowObjectType | null;
} = {}) {
  const queryKey = followListQueryKey(type);

  return useInfiniteQuery<
    FollowPage,
    Error,
    InfiniteData<FollowPage>,
    typeof queryKey,
    number
  >({
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => listFollows({ limit, page: pageParam, type }),
    queryKey,
  });
}

export function getFollowedTargetIds(
  data: InfiniteData<FollowPage> | undefined,
) {
  return new Set(
    data?.pages.flatMap((page) => page.items.map((item) => item.objectId)) ??
      [],
  );
}

export function useFollowStatus({
  objectId,
  objectType,
}: {
  objectId: string;
  objectType: FollowObjectType;
}) {
  const normalizedObjectId = objectId.trim();

  return useQuery({
    enabled: Boolean(normalizedObjectId),
    queryFn: () =>
      getFollowStatus({ objectId: normalizedObjectId, objectType }),
    queryKey: followStatusQueryKey(objectType, normalizedObjectId),
  });
}

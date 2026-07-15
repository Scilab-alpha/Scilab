"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserFriendlyApiErrorMessage } from "@/core/api";
import { listFollows, toggleFollow } from "@/features/follows/api/follows.api";
import type {
  FollowItem,
  FollowObjectType,
  NotifyMode,
} from "@/features/follows/types/follow.types";

export function useFollows(objectType?: FollowObjectType) {
  const [items, setItems] = useState<FollowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await listFollows({ page: 1, limit: 50, objectType });
      setItems(page.items);
    } catch (fetchError) {
      setItems([]);
      setError(getUserFriendlyApiErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  }, [objectType]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggle = useCallback(
    async (
      type: FollowObjectType,
      objectId: string,
      notifyMode: NotifyMode = "IN_APP",
    ) => {
      const result = await toggleFollow({
        objectType: type,
        objectId,
        notifyMode,
      });

      if (result.followed) {
        await reload();
      } else {
        setItems((prev) =>
          prev.filter(
            (item) => !(item.objectType === type && item.objectId === objectId),
          ),
        );
      }

      return result;
    },
    [reload],
  );

  return {
    items,
    isLoading,
    error,
    reload,
    toggle,
  };
}

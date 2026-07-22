import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toggleFollow } from "@/features/follows/api/follow.service";
import { followsQueryKey } from "@/features/follows/hooks/use-follows";

export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleFollow,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: followsQueryKey });
    },
  });
}

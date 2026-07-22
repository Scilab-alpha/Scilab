import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toggleBookmark } from "@/features/bookmarks/api/bookmark.service";
import { bookmarksQueryKey } from "@/features/bookmarks/hooks/use-bookmarks";

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookmarksQueryKey });
    },
  });
}

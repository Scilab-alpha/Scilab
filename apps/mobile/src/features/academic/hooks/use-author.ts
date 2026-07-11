import { useQuery } from "@tanstack/react-query";

import { getAuthorById } from "@/features/academic/api/author.service";

export function useAuthor(authorId: string) {
  return useQuery({
    enabled: Boolean(authorId),
    queryFn: () => getAuthorById(authorId),
    queryKey: ["academic", "author", authorId],
  });
}

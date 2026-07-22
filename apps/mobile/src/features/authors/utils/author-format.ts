import type { AuthorNode } from "@/types/academic.type";

export function getAuthorDisplayName(author: Pick<AuthorNode, "displayName">) {
  return author.displayName?.trim() || "Unknown author";
}

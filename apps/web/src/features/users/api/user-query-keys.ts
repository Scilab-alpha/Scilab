export const USER_QUERY_KEYS = {
  me: ["users", "me"] as const,
  list: ["users", "list"] as const,
  detail: (userId: string) => ["users", "detail", userId] as const,
};

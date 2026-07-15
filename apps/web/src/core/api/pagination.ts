/** Offset pagination used by notifications, bookmarks, follows. */
export type PageResult<TItem> = {
  items: TItem[];
  page: number;
  limit: number;
  hasMore: boolean;
};

export type PageParams = {
  page?: number;
  limit?: number;
};

export type CursorPage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

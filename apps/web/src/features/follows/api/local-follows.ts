import type {
  FollowItem,
  FollowObjectType,
  NotifyMode,
  ToggleFollowResponse,
} from "@/features/follows/types/follow.types";

export const LOCAL_FOLLOWS_STORAGE_KEY = "scilab_local_follows";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isServerFollowableObjectId(objectId: string) {
  return UUID_PATTERN.test(objectId.trim());
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readAll(): FollowItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_FOLLOWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FollowItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: FollowItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_FOLLOWS_STORAGE_KEY, JSON.stringify(items));
}

export function listLocalFollows(objectType?: FollowObjectType): FollowItem[] {
  const items = readAll().sort(
    (a, b) =>
      new Date(b.followedAt).getTime() - new Date(a.followedAt).getTime(),
  );
  return objectType
    ? items.filter((item) => item.objectType === objectType)
    : items;
}

export function isLocallyFollowing(
  objectType: FollowObjectType,
  objectId: string,
) {
  return readAll().some(
    (item) => item.objectType === objectType && item.objectId === objectId,
  );
}

export function toggleLocalFollow(input: {
  objectType: FollowObjectType;
  objectId: string;
  displayName?: string | null;
  notifyMode?: NotifyMode;
}): ToggleFollowResponse {
  const objectId = input.objectId.trim();
  const existing = readAll();
  const index = existing.findIndex(
    (item) =>
      item.objectType === input.objectType && item.objectId === objectId,
  );

  if (index >= 0) {
    existing.splice(index, 1);
    writeAll(existing);
    return {
      objectType: input.objectType,
      objectId,
      followed: false,
    };
  }

  const followedAt = new Date().toISOString();
  const notifyMode = input.notifyMode ?? "IN_APP";
  existing.unshift({
    followId: `local-${input.objectType}-${objectId}`,
    objectType: input.objectType,
    objectId,
    notifyMode,
    followedAt,
    target: {
      type: input.objectType,
      id: objectId,
      displayName: input.displayName ?? objectId,
    },
  });
  writeAll(existing);

  return {
    objectType: input.objectType,
    objectId,
    followed: true,
    notifyMode,
    followedAt,
  };
}

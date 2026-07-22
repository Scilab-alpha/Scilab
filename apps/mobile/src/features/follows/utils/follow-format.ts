import type { FollowListItem } from "@/features/follows/types/follow.type";

export function getFollowTitle(follow: FollowListItem) {
  const target = follow.target as FollowListItem["target"] & {
    name?: string | null;
    title?: string | null;
  };

  return (
    target.displayName?.trim() ||
    target.name?.trim() ||
    target.title?.trim() ||
    target.sourceId?.trim() ||
    follow.objectId
  );
}

export function getFollowIcon(follow: FollowListItem) {
  if (follow.objectType === "AUTHOR") {
    return "person-outline" as const;
  }

  if (follow.objectType === "JOURNAL") {
    return "book-outline" as const;
  }

  if (follow.objectType === "TOPIC") {
    return "albums-outline" as const;
  }

  return "albums-outline" as const;
}

export function formatFollowMeta(follow: FollowListItem) {
  const parts = [
    formatObjectType(follow.objectType),
    formatFollowedAt(follow.followedAt),
  ].filter(Boolean);

  return parts.join(" - ");
}

function formatObjectType(value: FollowListItem["objectType"]) {
  return value[0] + value.slice(1).toLowerCase();
}

function formatFollowedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `Followed ${new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date)}`;
}

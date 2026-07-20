import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { AcademicLoadMoreButton } from "@/features/academic/components/academic-load-more-button";
import { ArticleErrorState } from "@/features/academic/components/article-error-state";
import { useFollows } from "@/features/follows/hooks/use-follows";
import type { FollowListItem } from "@/features/follows/types/follow.type";
import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function FollowingList() {
  const theme = useAppTheme();
  const followsQuery = useFollows();
  const follows = useMemo(
    () => followsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [followsQuery.data],
  );

  return (
    <View style={{ gap: theme.spacing.md }}>
      {followsQuery.isError ? (
        <ArticleErrorState
          message={getUserFriendlyApiErrorMessage(followsQuery.error)}
          onRetry={() => void followsQuery.refetch()}
          title="Could not load follows"
        />
      ) : null}

      {followsQuery.isLoading ? (
        <SurfaceCard>
          <View style={{ alignItems: "center", minHeight: 80 }}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        </SurfaceCard>
      ) : follows.length === 0 && !followsQuery.isError ? (
        <FollowingEmptyState />
      ) : (
        follows.map((follow) => (
          <FollowingCard follow={follow} key={follow.followId} />
        ))
      )}

      {followsQuery.hasNextPage ? (
        <AcademicLoadMoreButton
          isLoading={followsQuery.isFetchingNextPage}
          label="Load more follows"
          onPress={() => void followsQuery.fetchNextPage()}
        />
      ) : null}
    </View>
  );
}

function FollowingEmptyState() {
  const theme = useAppTheme();

  return (
    <SurfaceCard>
      <View style={{ alignItems: "center", gap: 8, padding: 8 }}>
        <Ionicons color={theme.colors.primary} name="radio-outline" size={28} />
        <Text
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          No followed targets yet
        </Text>
        <Text
          selectable
          style={[
            theme.typography.body,
            { color: theme.colors.textMuted, textAlign: "center" },
          ]}
        >
          Follow journals, topics, or keywords to build your research signal.
        </Text>
      </View>
    </SurfaceCard>
  );
}

function FollowingCard({ follow }: { follow: FollowListItem }) {
  const theme = useAppTheme();
  const content = (
    <SurfaceCard>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Ionicons
          color={theme.colors.primary}
          name={getFollowIcon(follow)}
          size={20}
        />
        <View style={{ flex: 1, gap: 5 }}>
          <Text
            numberOfLines={2}
            selectable
            style={[theme.typography.label, { color: theme.colors.text }]}
          >
            {getFollowTitle(follow)}
          </Text>
          <Text
            numberOfLines={2}
            selectable
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            {formatFollowMeta(follow)}
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );

  if (follow.objectType !== "JOURNAL" && follow.objectType !== "AUTHOR") {
    return content;
  }

  const href =
    follow.objectType === "AUTHOR"
      ? (`/authors/${encodeURIComponent(follow.objectId)}` as Href)
      : (`/journals/${encodeURIComponent(follow.objectId)}` as Href);

  return (
    <Link asChild href={href}>
      <Pressable accessibilityRole="button">{content}</Pressable>
    </Link>
  );
}

function getFollowTitle(follow: FollowListItem) {
  return follow.target.displayName?.trim() || "Untitled target";
}

function getFollowIcon(follow: FollowListItem) {
  if (follow.objectType === "AUTHOR") {
    return "person-outline" as const;
  }

  if (follow.objectType === "JOURNAL") {
    return "book-outline" as const;
  }

  if (follow.objectType === "TOPIC") {
    return "albums-outline" as const;
  }

  return "pricetag-outline" as const;
}

function formatFollowMeta(follow: FollowListItem) {
  const parts = [
    formatObjectType(follow.objectType),
    formatNotifyMode(follow.notifyMode),
    formatFollowedAt(follow.followedAt),
  ].filter(Boolean);

  return parts.join(" - ");
}

function formatObjectType(value: FollowListItem["objectType"]) {
  return value[0] + value.slice(1).toLowerCase();
}

function formatNotifyMode(value: FollowListItem["notifyMode"]) {
  return value
    .split("_")
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(" ");
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

import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, type Href } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import { AppSegmentedControl, useToast } from "@/components/ui";
import { AcademicLoadMoreButton } from "@/features/academic/components/academic-load-more-button";
import { ArticleErrorState } from "@/features/academic/components/article-error-state";
import { useFollows } from "@/features/follows/hooks/use-follows";
import { useToggleFollow } from "@/features/follows/hooks/use-toggle-follow";
import type {
  FollowListItem,
  FollowObjectType,
} from "@/features/follows/types/follow.type";
import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

type FollowingFilter = "ALL" | FollowObjectType;

export function FollowingList() {
  const theme = useAppTheme();
  const [filter, setFilter] = useState<FollowingFilter>("ALL");
  const selectedType = filter === "ALL" ? null : filter;
  const followsQuery = useFollows({ type: selectedType });
  const follows = useMemo(
    () =>
      followsQuery.data?.pages
        .flatMap((page) => page.items)
        .filter((item) => (item.objectType as string) !== "KEYWORD") ?? [],
    [followsQuery.data],
  );

  return (
    <View style={{ gap: theme.spacing.md }}>
      <AppSegmentedControl
        compact
        label="Following type"
        onChange={setFilter}
        options={[
          { label: "All", value: "ALL" },
          { label: "Journals", value: "JOURNAL" },
          { label: "Topics", value: "TOPIC" },
        ]}
        value={filter}
      />

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
        <FollowingEmptyState filter={filter} />
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

function FollowingEmptyState({ filter }: { filter: FollowingFilter }) {
  const theme = useAppTheme();

  return (
    <SurfaceCard>
      <View style={{ alignItems: "center", gap: 8, padding: 8 }}>
        <Ionicons color={theme.colors.primary} name="radio-outline" size={28} />
        <Text
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          {getEmptyTitle(filter)}
        </Text>
        <Text
          selectable
          style={[
            theme.typography.body,
            { color: theme.colors.textMuted, textAlign: "center" },
          ]}
        >
          {getEmptyMessage(filter)}
        </Text>
      </View>
    </SurfaceCard>
  );
}

function getEmptyTitle(filter: FollowingFilter) {
  if (filter === "JOURNAL") {
    return "No followed journals yet";
  }

  if (filter === "TOPIC") {
    return "No followed topics yet";
  }

  return "No followed targets yet";
}

function getEmptyMessage(filter: FollowingFilter) {
  if (filter === "JOURNAL") {
    return "Follow journals from journal profile pages.";
  }

  if (filter === "TOPIC") {
    return "Follow topic chips from article details.";
  }

  return "Follow journals and topics to build your research signal.";
}

function FollowingCard({ follow }: { follow: FollowListItem }) {
  const theme = useAppTheme();
  const { showToast } = useToast();
  const toggleFollow = useToggleFollow();
  const isPending =
    toggleFollow.isPending &&
    toggleFollow.variables?.objectId === follow.objectId &&
    toggleFollow.variables.objectType === follow.objectType;
  const target = (
    <View style={{ flexDirection: "row", gap: 12, minWidth: 0 }}>
      <Ionicons
        color={theme.colors.primary}
        name={getFollowIcon(follow)}
        size={20}
      />
      <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
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
          style={[theme.typography.caption, { color: theme.colors.textMuted }]}
        >
          {formatFollowMeta(follow)}
        </Text>
      </View>
    </View>
  );
  const linkedTarget =
    follow.objectType === "JOURNAL" ? (
      <Link
        asChild
        href={`/journals/${encodeURIComponent(follow.objectId)}` as Href}
      >
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            { flex: 1, minWidth: 0 },
            pressed ? { opacity: 0.78 } : null,
          ]}
        >
          {target}
        </Pressable>
      </Link>
    ) : (
      target
    );

  const unfollow = () => {
    if (isPending) {
      return;
    }

    toggleFollow.mutate(
      { objectId: follow.objectId, objectType: follow.objectType },
      {
        onError: (error) => {
          showToast(getUserFriendlyApiErrorMessage(error), { tone: "error" });
        },
        onSuccess: () => {
          showToast("Follow removed from your library.", { tone: "success" });
        },
      },
    );
  };
  const handleUnfollowPress = () => {
    Alert.alert(
      "Unfollow",
      `Stop following ${getFollowTitle(follow)}?`,
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: unfollow,
          style: "destructive",
          text: "Unfollow",
        },
      ],
    );
  };

  return (
    <SurfaceCard>
      <View style={{ paddingRight: 74 }}>
        {linkedTarget}
        <Pressable
          accessibilityLabel={`Unfollow ${getFollowTitle(follow)}`}
          accessibilityRole="button"
          disabled={isPending}
          onPress={handleUnfollowPress}
          style={({ pressed }) => [
            {
              alignItems: "center",
              borderRadius: theme.radii.pill,
              justifyContent: "center",
              position: "absolute",
              right: 0,
              top: 0,
              minHeight: 28,
              paddingHorizontal: 6,
            },
            pressed || isPending ? { opacity: 0.72 } : null,
          ]}
        >
          {isPending ? (
            <ActivityIndicator color={theme.colors.error} size="small" />
          ) : (
            <Text
              numberOfLines={1}
              style={[
                theme.typography.caption,
                { color: theme.colors.outline, fontWeight: "700" },
              ]}
            >
              Unfollow
            </Text>
          )}
        </Pressable>
      </View>
    </SurfaceCard>
  );
}

function getFollowTitle(follow: FollowListItem) {
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

function getFollowIcon(follow: FollowListItem) {
  if (follow.objectType === "JOURNAL") {
    return "book-outline" as const;
  }

  if (follow.objectType === "TOPIC") {
    return "albums-outline" as const;
  }

  return "albums-outline" as const;
}

function formatFollowMeta(follow: FollowListItem) {
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

import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AppSegmentedControl } from "@/components/ui";
import { AcademicLoadMoreButton } from "@/components/academic/academic-load-more-button";
import { ArticleErrorState } from "@/components/academic/article-error-state";
import { FollowingCard } from "@/features/follows/components/following-card";
import { FollowingEmptyState } from "@/features/follows/components/following-empty-state";
import { useFollows } from "@/features/follows/hooks/use-follows";
import type { FollowObjectType } from "@/features/follows/types/follow.type";
import { SurfaceCard } from "@/components/layout/screen-shell";
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
          { label: "Authors", value: "AUTHOR" },
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

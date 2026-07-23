import Ionicons from "@expo/vector-icons/Ionicons";
import { type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { SurfaceCard } from "@/components/layout/screen-shell";
import {
  getArticleJournal,
  getArticleTitle,
} from "@/features/articles/utils/article-format";
import { DashboardSectionCard } from "@/features/dashboard/components/dashboard-section-card";
import type { DashboardBookmark } from "@/features/dashboard/types/dashboard.type";
import {
  formatFollowType,
  formatSavedAt,
} from "@/features/dashboard/utils/dashboard-format";
import type { FollowListItem } from "@/features/follows/types/follow.type";
import {
  getFollowIcon,
  getFollowTitle,
} from "@/features/follows/utils/follow-format";
import { useAppTheme } from "@/theme";

import { EmptyBlock } from "./dashboard-state-block";

export function RecentlySavedContent({
  savedArticles,
}: {
  savedArticles: DashboardBookmark[];
}) {
  if (savedArticles.length === 0) {
    return (
      <SurfaceCard>
        <EmptyBlock
          description="Saved papers from article details will appear here."
          icon="bookmark-outline"
          title="No saved papers yet"
        />
      </SurfaceCard>
    );
  }

  return (
    <View style={styles.list}>
      {savedArticles.map((bookmark) => (
        <SavedPaperRow bookmark={bookmark} key={bookmark.articleId} />
      ))}
    </View>
  );
}

export function RecentlyFollowedContent({
  follows,
}: {
  follows: FollowListItem[];
}) {
  if (follows.length === 0) {
    return (
      <SurfaceCard>
        <EmptyBlock
          description="Authors, journals, keywords and topics you follow will appear here."
          icon="radio-outline"
          title="No follows yet"
        />
      </SurfaceCard>
    );
  }

  return (
    <View style={styles.list}>
      {follows.slice(0, 5).map((follow) => (
        <FollowRow follow={follow} key={follow.followId} />
      ))}
    </View>
  );
}

function SavedPaperRow({ bookmark }: { bookmark: DashboardBookmark }) {
  const theme = useAppTheme();
  const articleHref = `/articles/${encodeURIComponent(
    bookmark.articleId,
  )}` as Href;

  return (
    <DashboardSectionCard
      backgroundColor={theme.colors.surface}
      href={articleHref}
    >
      <View style={styles.row}>
        <Ionicons
          color={theme.colors.primary}
          name="bookmark"
          size={18}
          style={styles.rowIcon}
        />
        <View style={styles.rowCopy}>
          <Text
            numberOfLines={2}
            selectable
            style={[
              theme.typography.heading,
              styles.rowTitle,
              { color: theme.colors.text },
            ]}
          >
            {getArticleTitle(bookmark.article)}
          </Text>
          <Text
            numberOfLines={2}
            selectable
            style={[styles.rowMeta, { color: theme.colors.textMuted }]}
          >
            {getArticleJournal(bookmark.article)} -{" "}
            {formatSavedAt(bookmark.bookmarkedAt)}
          </Text>
        </View>
      </View>
    </DashboardSectionCard>
  );
}

function FollowRow({ follow }: { follow: FollowListItem }) {
  const theme = useAppTheme();
  const href = getFollowHref(follow);

  return (
    <DashboardSectionCard backgroundColor={theme.colors.surface} href={href}>
      <View style={styles.row}>
        <Ionicons
          color={theme.colors.primary}
          name={getFollowIcon(follow)}
          size={18}
          style={styles.rowIcon}
        />
        <View style={styles.rowCopy}>
          <Text
            numberOfLines={2}
            selectable
            style={[
              theme.typography.heading,
              styles.rowTitle,
              { color: theme.colors.text },
            ]}
          >
            {getFollowTitle(follow)}
          </Text>
          <Text
            numberOfLines={1}
            selectable
            style={[styles.rowMeta, { color: theme.colors.textMuted }]}
          >
            {formatFollowType(follow.objectType)}
          </Text>
        </View>
      </View>
    </DashboardSectionCard>
  );
}

function getFollowHref(follow: FollowListItem) {
  if (follow.objectType === "AUTHOR") {
    return `/authors/${encodeURIComponent(follow.objectId)}` as Href;
  }

  if (follow.objectType === "JOURNAL") {
    return `/journals/${encodeURIComponent(follow.objectId)}` as Href;
  }

  return undefined;
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  rowCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  rowIcon: {
    marginTop: 2,
  },
  rowMeta: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 21,
  },
});

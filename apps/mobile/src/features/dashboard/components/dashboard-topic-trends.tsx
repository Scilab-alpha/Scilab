import { StyleSheet, Text, type DimensionValue, View } from "react-native";

import { DashboardSectionCard } from "@/features/dashboard/components/dashboard-section-card";
import type { DashboardTrendingTopic } from "@/features/dashboard/types/dashboard.type";
import {
  formatChange,
  formatCount,
  getSoftNegativeColor,
} from "@/features/dashboard/utils/dashboard-format";
import { useAppTheme } from "@/theme";

export function TrendingTopicsContent({
  topics,
}: {
  topics: DashboardTrendingTopic[];
}) {
  const visibleTopics = topics.slice(0, 5);
  const maxTopicCount = Math.max(
    ...visibleTopics.map((topic) => topic.count),
    1,
  );

  if (visibleTopics.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {visibleTopics.map((topic) => (
        <TopicTrendRow
          key={topic.name}
          maxTopicCount={maxTopicCount}
          topic={topic}
        />
      ))}
    </View>
  );
}

function TopicTrendRow({
  maxTopicCount,
  topic,
}: {
  maxTopicCount: number;
  topic: DashboardTrendingTopic;
}) {
  const theme = useAppTheme();
  const barWidth =
    topic.count === 0
      ? "0%"
      : (`${Math.max(
          8,
          Math.round((topic.count / maxTopicCount) * 100),
        )}%` as DimensionValue);
  const changeColor =
    topic.changePercent > 0
      ? theme.colors.success
      : topic.changePercent < 0
        ? getSoftNegativeColor(theme.isDark)
        : theme.colors.textMuted;

  return (
    <DashboardSectionCard backgroundColor={theme.colors.surfaceMuted}>
      <View style={styles.header}>
        <Text
          numberOfLines={2}
          selectable
          style={[
            theme.typography.label,
            styles.title,
            { color: theme.colors.text },
          ]}
        >
          {topic.name}
        </Text>
      </View>

      <Text
        numberOfLines={1}
        selectable
        style={[styles.meta, { color: theme.colors.textMuted }]}
      >
        {formatCount(topic.count)} articles
      </Text>

      <View
        style={[styles.track, { backgroundColor: theme.colors.outlineSoft }]}
      >
        <View
          style={[
            styles.bar,
            {
              backgroundColor: theme.colors.primary,
              width: barWidth,
            },
          ]}
        />
      </View>

      <View
        style={[styles.footer, { borderTopColor: theme.colors.outlineSoft }]}
      >
        <Text
          numberOfLines={1}
          selectable
          style={[styles.changeMeta, { color: changeColor }]}
        >
          Change {formatChange(topic.changePercent)}
        </Text>
      </View>
    </DashboardSectionCard>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 8,
  },
  changeMeta: {
    fontSize: 10,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "right",
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  list: {
    gap: 12,
  },
  meta: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  track: {
    height: 8,
    marginTop: 12,
    overflow: "hidden",
  },
});

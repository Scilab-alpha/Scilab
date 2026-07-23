import { StyleSheet, Text, type DimensionValue, View } from "react-native";

import { DashboardSectionCard } from "@/features/dashboard/components/dashboard-section-card";
import type { DashboardYearPoint } from "@/features/dashboard/types/dashboard.type";
import {
  formatCompactCount,
  getMutedPrimaryBarColor,
} from "@/features/dashboard/utils/dashboard-format";
import { useAppTheme } from "@/theme";

export function PublicationGrowthContent({
  growth,
}: {
  growth: DashboardYearPoint[];
}) {
  const theme = useAppTheme();
  const visibleGrowth = growth.slice(-5);
  const maxArticles = Math.max(
    ...visibleGrowth.map((point) => point.articles),
    1,
  );
  const midArticles = Math.round(maxArticles / 2);

  if (visibleGrowth.length === 0) {
    return null;
  }

  return (
    <DashboardSectionCard backgroundColor={theme.colors.surfaceMuted}>
      <Text
        numberOfLines={1}
        selectable
        style={[styles.axisTitle, { color: theme.colors.textMuted }]}
      >
        Articles
      </Text>
      <View style={styles.plotRow}>
        <View style={styles.yAxis}>
          <View style={styles.axisLabels}>
            <GrowthAxisLabel value={maxArticles} />
            <GrowthAxisLabel value={midArticles} />
            <GrowthAxisLabel value={0} />
          </View>
        </View>
        <View style={styles.xAxis}>
          <View style={styles.plot}>
            <View style={styles.chart}>
              {visibleGrowth.map((point) => (
                <PublicationGrowthBar
                  key={point.year}
                  maxArticles={maxArticles}
                  point={point}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
      <View style={styles.axisFooter}>
        <View />
        <Text
          numberOfLines={1}
          selectable
          style={[styles.axisTitle, { color: theme.colors.textMuted }]}
        >
          Year
        </Text>
      </View>
    </DashboardSectionCard>
  );
}

function GrowthAxisLabel({ value }: { value: number }) {
  const theme = useAppTheme();

  return (
    <Text
      numberOfLines={1}
      selectable
      style={[styles.axisLabel, { color: theme.colors.textMuted }]}
    >
      {formatCompactCount(value)}
    </Text>
  );
}

function PublicationGrowthBar({
  maxArticles,
  point,
}: {
  maxArticles: number;
  point: DashboardYearPoint;
}) {
  const theme = useAppTheme();
  const barHeight =
    point.articles === 0
      ? "0%"
      : (`${Math.max(
          10,
          Math.round((point.articles / maxArticles) * 100),
        )}%` as DimensionValue);
  const isPeak = point.articles === maxArticles;

  return (
    <View style={styles.barItem}>
      <Text
        numberOfLines={1}
        selectable
        style={[
          styles.count,
          { color: isPeak ? theme.colors.primary : theme.colors.textMuted },
        ]}
      >
        {formatCompactCount(point.articles)}
      </Text>
      <View
        style={[
          styles.columnTrack,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderBottomColor: theme.colors.outline,
            borderTopColor: theme.colors.outlineSoft,
          },
        ]}
      >
        <View
          style={[
            styles.column,
            {
              backgroundColor: isPeak
                ? theme.colors.primary
                : getMutedPrimaryBarColor(theme.isDark),
              height: barHeight,
            },
          ]}
        />
      </View>
      <Text
        numberOfLines={1}
        selectable
        style={[styles.year, { color: theme.colors.textMuted }]}
      >
        {point.year}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  axisFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 36,
  },
  axisLabel: {
    fontSize: 8,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 11,
    textAlign: "right",
  },
  axisLabels: {
    height: 82,
    justifyContent: "space-between",
    width: 28,
  },
  axisTitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    lineHeight: 12,
    textTransform: "uppercase",
  },
  barItem: {
    alignItems: "center",
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
    minHeight: 112,
    zIndex: 1,
  },
  column: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  columnTrack: {
    borderBottomWidth: 1,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 82,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  count: {
    fontSize: 9,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 12,
  },
  plot: {
    flex: 1,
    position: "relative",
  },
  plotRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 6,
  },
  xAxis: {
    flex: 1,
    minWidth: 0,
  },
  yAxis: {
    width: 30,
  },
  year: {
    fontSize: 9,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    lineHeight: 12,
  },
});

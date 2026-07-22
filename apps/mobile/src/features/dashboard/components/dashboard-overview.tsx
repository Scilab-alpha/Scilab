import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

export type DashboardMetric = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
};

export function OverviewCard({ metrics }: { metrics: DashboardMetric[] }) {
  const theme = useAppTheme();

  return (
    <View style={styles.overview}>
      <View style={styles.overviewHeader}>
        <View style={styles.overviewCopy}>
          <Text
            selectable
            style={[styles.overviewTitle, { color: theme.colors.text }]}
          >
            Research overview
          </Text>
          <Text
            selectable
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted },
            ]}
          >
            Updated from saved works and catalog data
          </Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        {metrics.map((metric, index) => (
          <MetricItem
            accented={index === 0}
            key={metric.label}
            metric={metric}
          />
        ))}
      </View>
    </View>
  );
}

function MetricItem({
  accented = false,
  metric,
}: {
  accented?: boolean;
  metric: DashboardMetric;
}) {
  const theme = useAppTheme();
  const valueColor = accented ? theme.colors.primary : theme.colors.text;
  const labelColor = accented ? theme.colors.primary : theme.colors.textMuted;

  return (
    <View
      style={[
        styles.metricItem,
        {
          backgroundColor: accented
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor: accented
              ? theme.colors.surface
              : theme.colors.primarySoft,
            borderRadius: theme.radii.pill,
          },
        ]}
      >
        <Ionicons color={theme.colors.primary} name={metric.icon} size={15} />
      </View>
      <Text selectable style={[styles.metricValue, { color: valueColor }]}>
        {metric.value}
      </Text>
      <Text
        numberOfLines={1}
        selectable
        style={[theme.typography.caption, { color: labelColor }]}
      >
        {metric.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metricItem: {
    alignItems: "center",
    aspectRatio: 1,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    justifyContent: "center",
    minWidth: 0,
    padding: 8,
  },
  metricIcon: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  metricRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricValue: {
    fontSize: 24,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 27,
  },
  overview: {
    gap: 14,
  },
  overviewCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  overviewHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
  },
});

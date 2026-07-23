import { StyleSheet, Text, View } from "react-native";

import type { DashboardCatalog } from "@/features/dashboard/types/dashboard.type";
import {
  formatCompactCount,
  formatDate,
} from "@/features/dashboard/utils/dashboard-format";
import { useAppTheme } from "@/theme";

export function CatalogSnapshot({ catalog }: { catalog: DashboardCatalog }) {
  const stats = [
    { label: "Journals", value: catalog.journalCount },
    { label: "Articles", value: catalog.articleCount },
    { label: "Keywords", value: catalog.uniqueKeywordCount },
    { label: "Topics", value: catalog.topicsAndSubjectsCount },
  ];

  return (
    <View style={styles.block}>
      <View style={styles.statGrid}>
        {stats.map((stat) => (
          <CatalogStat key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>
      {catalog.asOf ? <CatalogUpdatedAt value={catalog.asOf} /> : null}
    </View>
  );
}

function CatalogStat({ label, value }: { label: string; value: number }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.stat,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        selectable
        style={[styles.value, { color: theme.colors.text }]}
      >
        {formatCompactCount(value)}
      </Text>
      <Text
        numberOfLines={1}
        selectable
        style={[theme.typography.caption, { color: theme.colors.textMuted }]}
      >
        {label}
      </Text>
    </View>
  );
}

function CatalogUpdatedAt({ value }: { value: string }) {
  const theme = useAppTheme();
  const formatted = formatDate(value);

  if (!formatted) {
    return null;
  }

  return (
    <Text
      numberOfLines={1}
      selectable
      style={[styles.updatedAt, { color: theme.colors.textMuted }]}
    >
      Updated {formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  stat: {
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 4,
    minWidth: 0,
    padding: 14,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  updatedAt: {
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
  },
  value: {
    fontSize: 21,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 25,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

export function AcademicResultsHeader({
  count,
  noun,
}: {
  count: number;
  noun: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.resultsHeader}>
      <Text
        selectable
        style={[theme.typography.caption, { color: theme.colors.textMuted }]}
      >
        Showing {count} {noun}
        {count === 1 ? "" : "s"}
      </Text>
      <View style={styles.sortControl}>
        <Text
          numberOfLines={1}
          selectable
          style={[theme.typography.caption, { color: theme.colors.primary }]}
        >
          Most Relevant
        </Text>
        <Ionicons color={theme.colors.primary} name="chevron-down" size={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  sortControl: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
});

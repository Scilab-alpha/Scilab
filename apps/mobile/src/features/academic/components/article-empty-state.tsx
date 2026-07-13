import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

type ArticleEmptyStateProps = {
  keyword: string;
};

export function ArticleEmptyState({ keyword }: ArticleEmptyStateProps) {
  const theme = useAppTheme();
  const isSearching = keyword.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <Ionicons
        color={theme.colors.textMuted}
        name="document-text-outline"
        size={28}
      />
      <Text
        selectable
        style={[theme.typography.heading, { color: theme.colors.text }]}
      >
        {isSearching ? "No matching articles" : "No articles yet"}
      </Text>
      <Text
        selectable
        style={[theme.typography.body, { color: theme.colors.textMuted }]}
      >
        {isSearching
          ? "Try a broader keyword or clear the search."
          : "Articles will appear here when the academic index has data."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
    padding: 24,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

type ArticleErrorStateProps = {
  message: string;
  onRetry: () => void;
  title?: string;
};

export function ArticleErrorState({
  message,
  onRetry,
  title = "Could not load articles",
}: ArticleErrorStateProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onRetry}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? theme.colors.surfaceMuted
            : theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: theme.colors.primarySoft,
            borderRadius: theme.radii.pill,
          },
        ]}
      >
        <Ionicons
          color={theme.colors.primary}
          name="cloud-offline-outline"
          size={20}
        />
      </View>
      <View style={styles.copy}>
        <Text
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          {title}
        </Text>
        <Text
          numberOfLines={2}
          selectable
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          {message}
        </Text>
        <Text
          style={[theme.typography.caption, { color: theme.colors.primary }]}
        >
          Tap to retry
        </Text>
      </View>
      <Ionicons color={theme.colors.textMuted} name="refresh" size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  icon: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
});

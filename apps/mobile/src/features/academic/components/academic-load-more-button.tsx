import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/theme";

export function AcademicLoadMoreButton({
  isLoading,
  label,
  onPress,
}: {
  isLoading: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.loadMoreButton,
        {
          backgroundColor: pressed
            ? theme.colors.surfaceMuted
            : theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.sm,
          opacity: isLoading ? 0.7 : 1,
        },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : (
        <>
          <Text
            style={[theme.typography.label, { color: theme.colors.primary }]}
          >
            {label}
          </Text>
          <Ionicons
            color={theme.colors.primary}
            name="chevron-down"
            size={16}
          />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadMoreButton: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 44,
  },
});

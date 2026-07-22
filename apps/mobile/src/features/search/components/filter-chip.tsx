import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/theme";

export function FilterRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={styles.filterRow}
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function FilterChip({
  icon,
  label,
  onPress,
  selected = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: selected ? theme.colors.primarySoft : "transparent",
          borderColor: selected
            ? theme.colors.primarySoft
            : theme.colors.outlineSoft,
          borderRadius: theme.radii.pill,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Ionicons
        color={selected ? theme.colors.primary : theme.colors.textMuted}
        name={icon}
        size={12}
      />
      <Text
        numberOfLines={1}
        style={[
          theme.typography.caption,
          styles.filterLabel,
          { color: selected ? theme.colors.primary : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    maxWidth: 180,
    minHeight: 28,
    paddingHorizontal: 10,
  },
  filterLabel: {
    flexShrink: 1,
  },
  filterRow: {
    gap: 8,
  },
});

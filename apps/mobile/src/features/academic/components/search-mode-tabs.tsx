import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

export type SearchMode = "articles" | "authors";

export function SearchModeTabs({
  mode,
  onModeChange,
}: {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      style={[
        styles.tabs,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.outlineSoft,
          borderRadius: theme.radii.md,
        },
      ]}
    >
      <ModeTab
        isSelected={mode === "articles"}
        label="Articles"
        onPress={() => onModeChange("articles")}
      />
      <ModeTab
        isSelected={mode === "authors"}
        label="Authors"
        onPress={() => onModeChange("authors")}
      />
    </View>
  );
}

function ModeTab({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        {
          backgroundColor: isSelected
            ? theme.colors.surface
            : pressed
              ? theme.colors.primarySoft
              : "transparent",
          borderColor: isSelected ? theme.colors.outlineSoft : "transparent",
          borderRadius: theme.radii.sm,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          theme.typography.caption,
          {
            color: isSelected ? theme.colors.text : theme.colors.textMuted,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 0,
    paddingHorizontal: 10,
  },
  tabs: {
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 3,
  },
});

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
  return (
    <View accessibilityRole="radiogroup" style={styles.tabs}>
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
          borderBottomColor: isSelected ? theme.colors.primary : "transparent",
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          theme.typography.caption,
          styles.tabLabel,
          {
            color: isSelected ? theme.colors.text : theme.colors.outline,
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
    borderBottomWidth: 2,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 18,
  },
  tabLabel: {
    fontWeight: "700",
  },
  tabs: {
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
});

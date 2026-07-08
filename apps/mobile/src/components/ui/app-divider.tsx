import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

type AppDividerProps = {
  label: string;
};

export function AppDivider({ label }: AppDividerProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, { gap: theme.spacing.md }]}>
      <View
        style={[styles.line, { backgroundColor: theme.colors.outlineSoft }]}
      />
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.outline, textTransform: "uppercase" },
        ]}
      >
        {label}
      </Text>
      <View
        style={[styles.line, { backgroundColor: theme.colors.outlineSoft }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
});

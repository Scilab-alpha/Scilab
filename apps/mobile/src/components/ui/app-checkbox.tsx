import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

type AppCheckboxProps = {
  checked: boolean;
  error?: string;
  label: string;
  onChange: (checked: boolean) => void;
};

export function AppCheckbox({
  checked,
  error,
  label,
  onChange,
}: AppCheckboxProps) {
  const theme = useAppTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={[styles.row, { gap: theme.spacing.sm }]}
      >
        <View
          style={[
            styles.box,
            {
              backgroundColor: checked ? theme.colors.primary : "transparent",
              borderColor: error
                ? theme.colors.error
                : checked
                  ? theme.colors.primary
                  : theme.colors.outlineSoft,
              borderRadius: theme.radii.sm,
            },
          ]}
        >
          {checked ? (
            <Text style={[styles.check, { color: theme.colors.onPrimary }]}>
              {"\u2713"}
            </Text>
          ) : null}
        </View>
        <Text
          style={[theme.typography.caption, { color: theme.colors.textMuted }]}
        >
          {label}
        </Text>
      </Pressable>
      {error ? (
        <Text
          selectable
          style={[theme.typography.caption, { color: theme.colors.error }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    borderWidth: 1,
    height: 14,
    justifyContent: "center",
    width: 14,
  },
  check: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
});

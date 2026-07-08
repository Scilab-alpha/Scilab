import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { useAppTheme } from "@/theme";

type AppButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
};

export function AppButton({
  disabled = false,
  label,
  loading = false,
  onPress,
}: AppButtonProps) {
  const theme = useAppTheme();
  const unavailable = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed
            ? theme.colors.primaryPressed
            : theme.colors.primary,
          borderRadius: theme.radii.sm,
          opacity: unavailable ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.onPrimary} />
      ) : (
        <Text
          style={[theme.typography.label, { color: theme.colors.onPrimary }]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
});

import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

type AppMessageProps = {
  message?: string;
  tone?: "error" | "info" | "success";
};

export function AppMessage({ message, tone = "info" }: AppMessageProps) {
  const theme = useAppTheme();

  if (!message) return null;

  const isError = tone === "error";
  const isSuccess = tone === "success";
  const backgroundColor = isError
    ? theme.colors.errorSoft
    : isSuccess
      ? theme.colors.successSoft
      : theme.colors.primarySoft;
  const color = isError
    ? theme.colors.error
    : isSuccess
      ? theme.colors.success
      : theme.colors.primary;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        { backgroundColor, borderRadius: theme.radii.sm },
      ]}
    >
      <Text selectable style={[theme.typography.caption, { color }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

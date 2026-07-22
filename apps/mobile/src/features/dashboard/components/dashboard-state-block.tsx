import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/theme";

export function LoadingBlock({ label }: { label: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.stateBlock}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text
        selectable
        style={[theme.typography.body, { color: theme.colors.textMuted }]}
      >
        {label}
      </Text>
    </View>
  );
}

export function EmptyBlock({
  description,
  icon,
  title,
}: {
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.stateBlock}>
      <Ionicons color={theme.colors.primary} name={icon} size={26} />
      <View style={styles.stateCopy}>
        <Text
          selectable
          style={[theme.typography.label, { color: theme.colors.text }]}
        >
          {title}
        </Text>
        <Text
          selectable
          style={[
            theme.typography.body,
            { color: theme.colors.textMuted, textAlign: "center" },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stateBlock: {
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
    minHeight: 104,
    padding: 8,
  },
  stateCopy: {
    alignItems: "center",
    gap: 4,
  },
});

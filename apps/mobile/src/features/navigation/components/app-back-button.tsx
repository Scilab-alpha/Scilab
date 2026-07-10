import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { useAppTheme } from "@/theme";

export function AppBackButton() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      onPress={() => router.back()}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.colors.primarySoft,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Ionicons color={theme.colors.primary} name="arrow-back" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});

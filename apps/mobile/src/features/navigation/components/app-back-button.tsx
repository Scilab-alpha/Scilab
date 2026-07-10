import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

import { useAppTheme } from "@/theme";

type AppBackButtonProps = {
  variant?: "brown" | "plain" | "soft";
};

export function AppBackButton({ variant = "soft" }: AppBackButtonProps) {
  const router = useRouter();
  const theme = useAppTheme();
  const isPlain = variant === "plain";
  const isBrown = variant === "brown";

  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      onPress={() => router.back()}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPlain
            ? "transparent"
            : isBrown
              ? "transparent"
              : theme.colors.primarySoft,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <Ionicons
        color={
          isPlain
            ? theme.colors.text
            : isBrown
              ? theme.colors.primary
              : theme.colors.primary
        }
        name="chevron-back"
        size={24}
      />
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

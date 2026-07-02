import { ScrollView, Text, View } from "react-native";

import { AppButton } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

export function DiscoverScreen() {
  const theme = useAppTheme();
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        gap: theme.spacing.xl,
        justifyContent: "center",
        padding: theme.spacing.xxl,
      }}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <Text style={[theme.typography.display, { color: theme.colors.text }]}>
          Scilab Research Graph
        </Text>
        <Text
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          Your authenticated research discovery workspace is ready. Product tabs
          can now be added under the documented feature structure.
        </Text>
      </View>

      <AppButton
        label="Sign out"
        onPress={() => {
          void clearSession();
        }}
      />
    </ScrollView>
  );
}

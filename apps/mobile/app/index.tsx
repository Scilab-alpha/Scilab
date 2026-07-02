import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { DiscoverScreen } from "@/features/articles/screens/discover-screen";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

export default function IndexRoute() {
  const theme = useAppTheme();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  if (!isHydrated) {
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: theme.colors.background,
          flex: 1,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <DiscoverScreen />;
}

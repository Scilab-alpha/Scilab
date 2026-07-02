import { Stack } from "expo-router";
import "react-native-reanimated";

import { AppProviders } from "@/lib/app-providers";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="notifications"
          options={{
            headerBackTitle: "Back",
            headerShown: true,
            title: "Notifications",
          }}
        />
      </Stack>
    </AppProviders>
  );
}

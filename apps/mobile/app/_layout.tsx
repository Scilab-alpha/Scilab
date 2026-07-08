import { Stack } from "expo-router";
import "react-native-reanimated";

import { AppBackButton } from "@/features/navigation/components/app-back-button";
import { AppProviders } from "@/lib/app-providers";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="profile/edit"
          options={{
            headerBackVisible: false,
            headerLeft: () => <AppBackButton />,
            headerShown: true,
            headerShadowVisible: false,
            headerTitleAlign: "center",
            headerTitleStyle: { fontSize: 15, fontWeight: "700" },
            title: "Edit profile",
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerBackVisible: false,
            headerLeft: () => <AppBackButton />,
            headerShown: true,
            title: "Notifications",
          }}
        />
      </Stack>
    </AppProviders>
  );
}

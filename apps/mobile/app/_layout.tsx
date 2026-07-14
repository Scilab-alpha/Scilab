import { Stack } from "expo-router";
import "react-native-reanimated";

import { AppBackButton } from "@/features/navigation/components/app-back-button";
import { AppProviders } from "@/lib/app-providers";
import { useAppTheme } from "@/theme";

export default function RootLayout() {
  const theme = useAppTheme();

  return (
    <AppProviders>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            color: theme.colors.text,
            fontSize: 15,
            fontWeight: "700",
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="articles/[articleId]" />
        <Stack.Screen name="authors/[authorId]" />
        <Stack.Screen name="journals/[journalId]" />
        <Stack.Screen
          name="profile/edit"
          options={{
            headerBackVisible: false,
            headerLeft: () => <AppBackButton />,
            headerShown: true,
            headerShadowVisible: false,
            headerTitleAlign: "center",
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

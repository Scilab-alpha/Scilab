import { Stack } from "expo-router";
import "react-native-reanimated";

import { AppProviders } from "@/providers/app-providers";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}

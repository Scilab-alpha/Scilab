import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/features/navigation/components/app-header";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

const tabIcons: Record<string, { active: IconName; inactive: IconName }> = {
  dashboard: { active: "grid", inactive: "grid-outline" },
  library: { active: "library", inactive: "library-outline" },
  profile: { active: "person", inactive: "person-outline" },
  search: { active: "search", inactive: "search-outline" },
  trends: { active: "trending-up", inactive: "trending-up-outline" },
};

const tabLabels: Record<string, string> = {
  dashboard: "Dashboard",
  library: "Library",
  profile: "Profile",
  search: "Search",
  trends: "Trends",
};

export default function TabsLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  if (isHydrated && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <AppHeader />,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarIcon: ({ color, focused }) => {
          const icon = tabIcons[route.name] ?? tabIcons.dashboard;
          return (
            <TabItem
              color={color}
              focused={focused}
              icon={focused ? icon.active : icon.inactive}
              label={tabLabels[route.name] ?? route.name}
            />
          );
        },
        tabBarIconStyle: styles.iconSlot,
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineSoft,
          borderRadius: 18,
          borderTopWidth: 1,
          bottom: Math.max(insets.bottom, 8),
          height: 66,
          left: 10,
          paddingBottom: 7,
          paddingTop: 7,
          position: "absolute",
          right: 10,
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="trends" options={{ title: "Trends" }} />
      <Tabs.Screen name="library" options={{ title: "Library" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

function TabItem({
  color,
  focused,
  icon,
  label,
}: {
  color: string;
  focused: boolean;
  icon: IconName;
  label: string;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.pill,
        focused && { backgroundColor: theme.colors.primarySoft },
      ]}
    >
      <Ionicons color={color} name={icon} size={21} />
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: focused ? theme.colors.primary : theme.colors.textMuted,
            fontWeight: focused ? "800" : "600",
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    height: "100%",
    width: "100%",
  },
  pill: {
    alignItems: "center",
    alignSelf: "center",
    borderCurve: "continuous",
    borderRadius: 12,
    gap: 2,
    height: 50,
    justifyContent: "center",
    width: "94%",
  },
  label: {
    fontSize: 10,
  },
});

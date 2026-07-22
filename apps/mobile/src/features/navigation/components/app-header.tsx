import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotificationStore } from "@/features/notifications/store/notification.store";
import { useAppTheme } from "@/theme";

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderBottomColor: theme.colors.outlineSoft,
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingTop: insets.top,
      }}
    >
      <View style={styles.row}>
        <Text selectable style={[theme.typography.heading, styles.brand]}>
          Scholar<Text style={{ color: theme.colors.primary }}>Trend</Text>
        </Text>

        <View>
          <HeaderButton
            accessibilityLabel={
              unreadCount > 0
                ? `Open notifications, ${unreadCount} unread`
                : "Open notifications"
            }
            icon="notifications-outline"
            onPress={() => router.push("/notifications")}
          />
          {unreadCount > 0 ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.surface,
                },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: theme.colors.onPrimary }]}
              >
                {badgeLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function HeaderButton({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { backgroundColor: theme.colors.surfaceMuted },
      ]}
    >
      <Ionicons color={theme.colors.text} name={icon} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  brand: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  badge: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    justifyContent: "center",
    minWidth: 16,
    paddingHorizontal: 2,
    position: "absolute",
    right: 1,
    top: 1,
  },
  badgeText: {
    fontSize: 9,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    lineHeight: 10,
  },
});

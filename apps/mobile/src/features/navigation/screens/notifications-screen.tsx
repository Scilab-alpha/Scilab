import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import { useNotificationStore } from "@/features/notifications/store/notification.store";
import type {
  NotificationConnectionStatus,
  NotificationItem,
  NotificationItemKind,
} from "@/features/notifications/types/notification.type";
import { useAppTheme } from "@/theme";

export function NotificationsScreen() {
  const theme = useAppTheme();
  const connectionStatus = useNotificationStore(
    (state) => state.connectionStatus,
  );
  const lastError = useNotificationStore((state) => state.lastError);
  const markAllNotificationsRead = useNotificationStore(
    (state) => state.markAllNotificationsRead,
  );
  const markNotificationRead = useNotificationStore(
    (state) => state.markNotificationRead,
  );
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <ScrollView
      contentContainerStyle={{
        gap: theme.spacing.md,
        padding: theme.spacing.xl,
      }}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
    >
      <SurfaceCard>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCopy}>
            <Text
              selectable
              style={[theme.typography.heading, { color: theme.colors.text }]}
            >
              Notifications
            </Text>
            <Text
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted },
              ]}
            >
              {getStatusCopy(connectionStatus, unreadCount, lastError)}
            </Text>
          </View>

          {unreadCount > 0 ? (
            <Pressable
              accessibilityLabel="Mark all notifications as read"
              accessibilityRole="button"
              hitSlop={8}
              onPress={markAllNotificationsRead}
              style={({ pressed }) => [
                styles.textButton,
                pressed && { backgroundColor: theme.colors.surfaceMuted },
              ]}
            >
              <Text
                style={[theme.typography.label, { color: theme.colors.primary }]}
              >
                Mark all read
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SurfaceCard>

      {notifications.length === 0 ? (
        <EmptyNotifications />
      ) : (
        notifications.map((item) => (
          <NotificationCard
            item={item}
            key={item.eventId}
            onRead={() => markNotificationRead(item.id)}
          />
        ))
      )}
    </ScrollView>
  );
}

function NotificationCard({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: () => void;
}) {
  const theme = useAppTheme();
  const icon = getNotificationIcon(item.kind);

  return (
    <Pressable
      accessibilityLabel={`${item.title}. ${item.isRead ? "Read" : "Unread"}`}
      accessibilityRole="button"
      onPress={onRead}
      style={({ pressed }) => [pressed && { opacity: 0.86 }]}
    >
      <SurfaceCard>
        <View style={styles.notificationRow}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: item.isRead
                  ? theme.colors.surfaceMuted
                  : theme.colors.primarySoft,
              },
            ]}
          >
            <Ionicons
              color={item.isRead ? theme.colors.textMuted : theme.colors.primary}
              name={icon}
              size={20}
            />
          </View>

          <View style={styles.notificationCopy}>
            <View style={styles.titleRow}>
              <Text
                selectable
                style={[theme.typography.label, { color: theme.colors.text }]}
              >
                {item.title}
              </Text>
              {!item.isRead ? (
                <View
                  accessibilityLabel="Unread"
                  style={[
                    styles.unreadDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              ) : null}
            </View>

            <Text
              selectable
              style={[theme.typography.body, { color: theme.colors.textMuted }]}
            >
              {item.message}
            </Text>

            <Text
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted },
              ]}
            >
              {formatRelativeTime(item.occurredAt)}
            </Text>
          </View>
        </View>
      </SurfaceCard>
    </Pressable>
  );
}

function EmptyNotifications() {
  const theme = useAppTheme();

  return (
    <SurfaceCard>
      <View style={styles.emptyState}>
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: theme.colors.primarySoft },
          ]}
        >
          <Ionicons
            color={theme.colors.primary}
            name="notifications-outline"
            size={24}
          />
        </View>
        <View style={styles.emptyCopy}>
          <Text
            selectable
            style={[theme.typography.label, { color: theme.colors.text }]}
          >
            No notifications yet
          </Text>
          <Text
            selectable
            style={[theme.typography.body, { color: theme.colors.textMuted }]}
          >
            New realtime updates will appear here while you are signed in.
          </Text>
        </View>
      </View>
    </SurfaceCard>
  );
}

function getStatusCopy(
  status: NotificationConnectionStatus,
  unreadCount: number,
  lastError: string | null,
) {
  if (status === "connecting") {
    return "Connecting to realtime updates";
  }

  if (status === "error") {
    return lastError ?? "Realtime updates are unavailable";
  }

  if (status === "connected") {
    return unreadCount === 1
      ? "Connected, 1 unread update"
      : `Connected, ${unreadCount} unread updates`;
  }

  return "Sign in to receive realtime updates";
}

function getNotificationIcon(kind: NotificationItemKind) {
  switch (kind) {
    case "bookmark":
      return "bookmark-outline" as const;
    case "follow":
      return "radio-outline" as const;
    default:
      return "notifications-outline" as const;
  }
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSeconds < 60) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Date(value).toLocaleDateString();
}

const styles = StyleSheet.create({
  emptyCopy: {
    alignItems: "center",
    gap: 4,
  },
  emptyIcon: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  notificationCopy: {
    flex: 1,
    gap: 5,
  },
  notificationRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCopy: {
    flex: 1,
    gap: 4,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  textButton: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  unreadDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});

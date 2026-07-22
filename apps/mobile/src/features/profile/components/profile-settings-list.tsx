import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import { useAppTheme } from "@/theme";

export function ProfileSettingsList({
  isLoggingOut,
  onAboutPress,
  onEditProfilePress,
  onLogoutPress,
}: {
  isLoggingOut: boolean;
  onAboutPress: () => void;
  onEditProfilePress: () => void;
  onLogoutPress: () => void;
}) {
  return (
    <SurfaceCard>
      <SettingRow
        icon="person-outline"
        onPress={onEditProfilePress}
        title="Edit profile"
      />
      <SettingRow
        icon="lock-closed-outline"
        meta="Waiting API"
        title="Change password"
      />
      <SettingRow
        icon="notifications-outline"
        meta="Waiting API"
        title="Notifications"
      />
      <SettingRow
        icon="shield-checkmark-outline"
        meta="Waiting API"
        title="Privacy"
      />
      <SettingRow icon="language-outline" meta="Coming soon" title="Language" />
      <SettingRow
        icon="information-circle-outline"
        onPress={onAboutPress}
        title="About ScholarTrend"
      />
      <SettingRow
        icon="log-out-outline"
        isLoading={isLoggingOut}
        onPress={onLogoutPress}
        title="Log out"
        tone="danger"
      />
    </SurfaceCard>
  );
}

function SettingRow({
  icon,
  isLoading = false,
  meta,
  onPress,
  title,
  tone = "default",
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  isLoading?: boolean;
  meta?: string;
  onPress?: () => void;
  title: string;
  tone?: "danger" | "default";
}) {
  const theme = useAppTheme();
  const isDanger = tone === "danger";
  const contentColor = isDanger ? theme.colors.error : theme.colors.text;
  const iconColor = isDanger ? theme.colors.error : theme.colors.primary;
  const iconBackground = isDanger
    ? theme.colors.errorSoft
    : theme.colors.primarySoft;

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress || isLoading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        { opacity: pressed || isLoading ? 0.65 : 1 },
      ]}
    >
      <View style={[styles.iconSlot, { backgroundColor: iconBackground }]}>
        <Ionicons color={iconColor} name={icon} size={18} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: contentColor }]}>
          {title}
        </Text>
      </View>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.error} />
      ) : meta ? (
        <Text
          numberOfLines={1}
          style={[
            theme.typography.caption,
            styles.meta,
            { color: theme.colors.outline },
          ]}
        >
          {meta}
        </Text>
      ) : onPress ? (
        <Ionicons color={iconColor} name="chevron-forward" size={16} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  meta: {
    maxWidth: 136,
    textAlign: "right",
  },
  settingCopy: { flex: 1 },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 48,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
});

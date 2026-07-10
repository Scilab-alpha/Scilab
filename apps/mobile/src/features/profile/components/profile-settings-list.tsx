import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import type { UserProfile } from "@/features/profile/types/profile.type";
import { useAppTheme } from "@/theme";

export function ProfileSettingsList({
  isLoggingOut,
  onEditProfilePress,
  onLogoutPress,
  profile,
}: {
  isLoggingOut: boolean;
  onEditProfilePress: () => void;
  onLogoutPress: () => void;
  profile: UserProfile;
}) {
  return (
    <View style={styles.sections}>
      <SettingSection title="Account">
        <SettingRow
          icon="person-outline"
          onPress={onEditProfilePress}
          title="Edit profile"
        />
        <SettingRow
          icon="lock-closed-outline"
          meta="Waiting API"
          title="Account security"
        />
      </SettingSection>

      <SettingSection title="Notifications">
        <SettingRow
          icon="options-outline"
          meta="Waiting API"
          title="Notification preferences"
        />
        <SettingRow
          icon="radio-outline"
          meta="Waiting API"
          title="Follow alert mode"
        />
      </SettingSection>

      <SettingSection title="Preferences">
        <SettingRow
          icon="grid-outline"
          meta="Waiting API"
          title="Dashboard widgets"
        />
        <SettingRow
          icon="language-outline"
          meta="Coming soon"
          title="Language"
        />
        <SettingRow
          icon="color-palette-outline"
          meta="System"
          title="Appearance"
        />
      </SettingSection>

      {profile.role === "RESEARCHER" ? (
        <SettingSection title="Researcher">
          <SettingRow
            icon="document-text-outline"
            meta="Coming soon"
            title="Report exports"
          />
        </SettingSection>
      ) : null}

      <SettingSection title="Session">
        <SettingRow
          icon="log-out-outline"
          isLoading={isLoggingOut}
          onPress={onLogoutPress}
          title="Log out"
          tone="danger"
        />
      </SettingSection>
    </View>
  );
}

function SettingSection({
  children,
  title,
}: React.PropsWithChildren<{ title: string }>) {
  const theme = useAppTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>
        {title}
      </Text>
      <SurfaceCard>{children}</SurfaceCard>
    </View>
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
  section: { gap: 8 },
  sections: { gap: 16 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    textTransform: "uppercase",
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

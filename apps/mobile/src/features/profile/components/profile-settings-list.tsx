import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { type ThemeMode, useAppTheme } from "@/theme";

const themeModeOptions: { label: string; value: ThemeMode }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export function ProfileSettingsList({
  isLoggingOut,
  onEditProfilePress,
  onLogoutPress,
}: {
  isLoggingOut: boolean;
  onEditProfilePress: () => void;
  onLogoutPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.settingsList,
        {
          borderBottomColor: theme.colors.outlineSoft,
          borderTopColor: theme.colors.outlineSoft,
        },
      ]}
    >
      <SettingRow
        icon="person-outline"
        onPress={onEditProfilePress}
        showDivider={false}
        title="Edit profile"
      />
      <View
        style={[
          styles.themeRow,
          {
            borderTopColor: theme.colors.outlineSoft,
            paddingVertical: theme.spacing.sm,
          },
        ]}
      >
        <View style={styles.themeLabel}>
          <View
            style={[
              styles.iconSlot,
              { backgroundColor: theme.colors.primarySoft },
            ]}
          >
            <Ionicons
              color={theme.colors.primary}
              name={theme.isDark ? "moon-outline" : "sunny-outline"}
              size={18}
            />
          </View>
          <View style={styles.settingCopy}>
            <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
              Appearance
            </Text>
          </View>
        </View>
        <View
          accessibilityRole="radiogroup"
          style={[
            styles.themeOptions,
            {
              borderColor: theme.colors.outlineSoft,
              borderRadius: theme.radii.sm,
            },
          ]}
        >
          {themeModeOptions.map((option) => {
            const selected = option.value === theme.themeMode;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => {
                  void theme.setThemeMode(option.value);
                }}
                style={({ pressed }) => [
                  styles.themeOption,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : pressed
                        ? theme.colors.surfaceMuted
                        : "transparent",
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    theme.typography.caption,
                    {
                      color: selected
                        ? theme.colors.onPrimary
                        : theme.colors.textMuted,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <SettingRow
        icon="log-out-outline"
        isLoading={isLoggingOut}
        onPress={onLogoutPress}
        title="Log out"
        tone="danger"
      />
    </View>
  );
}

function SettingRow({
  icon,
  isLoading = false,
  onPress,
  showDivider = true,
  title,
  tone = "default",
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  isLoading?: boolean;
  onPress?: () => void;
  showDivider?: boolean;
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
        {
          borderTopColor: theme.colors.outlineSoft,
          borderTopWidth: showDivider ? StyleSheet.hairlineWidth : 0,
          opacity: pressed || isLoading ? 0.65 : 1,
        },
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
  settingCopy: { flex: 1 },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 48,
  },
  settingsList: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },
  themeLabel: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  themeOption: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 4,
  },
  themeOptions: {
    borderWidth: 1,
    flexDirection: "row",
    height: 34,
    overflow: "hidden",
    width: 172,
  },
  themeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
  },
});

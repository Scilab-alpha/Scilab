import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";

import { AppButton } from "@/components/ui";
import { useLogout } from "@/features/auth/hooks/use-logout";
import {
  ScreenShell,
  SurfaceCard,
} from "@/features/navigation/components/screen-shell";
import { getRoleLabel, getRoleSummary } from "@/features/auth/utils/roles";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

export function ProfileScreen() {
  const theme = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Scholar";

  return (
    <ScreenShell
      subtitle="Manage your identity and research preferences."
      title="Profile"
    >
      <SurfaceCard>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 14 }}>
          <View
            style={{
              alignItems: "center",
              backgroundColor: theme.colors.primarySoft,
              borderRadius: 32,
              height: 64,
              justifyContent: "center",
              width: 64,
            }}
          >
            <Ionicons color={theme.colors.primary} name="person" size={28} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text
              selectable
              style={[theme.typography.heading, { color: theme.colors.text }]}
            >
              {displayName}
            </Text>
            <Text
              selectable
              style={[theme.typography.body, { color: theme.colors.textMuted }]}
            >
              {user?.email ?? "Account email"}
            </Text>
            <Text
              selectable
              style={[
                theme.typography.caption,
                { color: theme.colors.primary },
              ]}
            >
              {getRoleLabel(user?.role)}
            </Text>
          </View>
        </View>
        <Text
          selectable
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          {getRoleSummary(user?.role)}
        </Text>
      </SurfaceCard>
      <SurfaceCard>
        <ProfileRow icon="person-outline" label="Personal information" />
        <ProfileRow
          icon="notifications-outline"
          label="Notification preferences"
        />
        <ProfileRow icon="language-outline" label="Language" />
        <ProfileRow icon="color-palette-outline" label="Appearance" />
        <ProfileRow icon="shield-checkmark-outline" label="Account security" />
        <ProfileRow icon="help-circle-outline" label="Help & about" />
      </SurfaceCard>
      <AppButton
        label="Log out"
        loading={logoutMutation.isPending}
        onPress={() => logoutMutation.mutate()}
      />
    </ScreenShell>
  );
}

function ProfileRow({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        minHeight: 42,
      }}
    >
      <Ionicons color={theme.colors.primary} name={icon} size={20} />
      <Text
        selectable
        style={[theme.typography.body, { color: theme.colors.text, flex: 1 }]}
      >
        {label}
      </Text>
      <Ionicons
        color={theme.colors.textMuted}
        name="chevron-forward"
        size={16}
      />
    </View>
  );
}

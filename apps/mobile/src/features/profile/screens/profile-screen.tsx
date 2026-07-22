import { ActivityIndicator, Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton, AppMessage } from "@/components/ui";
import { useLogout } from "@/features/auth/hooks/use-logout";
import {
  ScreenShell,
  SurfaceCard,
} from "@/features/navigation/components/screen-shell";
import { ProfileHeroCard } from "@/features/profile/components/profile-hero-card";
import { ProfileSettingsList } from "@/features/profile/components/profile-settings-list";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const profileQuery = useProfile();
  const logoutMutation = useLogout();
  const handleLogoutPress = () =>
    Alert.alert("Log out", "Are you sure you want to end this session?", [
      { style: "cancel", text: "Cancel" },
      {
        onPress: () => logoutMutation.mutate(),
        style: "destructive",
        text: "Log out",
      },
    ]);

  if (profileQuery.isPending) {
    return (
      <ScreenShell
        subtitle="Loading your account and personal information."
        title="Profile"
      >
        <SurfaceCard>
          <View
            style={{
              alignItems: "center",
              gap: theme.spacing.md,
              padding: theme.spacing.xxl,
            }}
          >
            <ActivityIndicator color={theme.colors.primary} />
            <Text
              selectable
              style={[theme.typography.body, { color: theme.colors.textMuted }]}
            >
              Loading profile...
            </Text>
          </View>
        </SurfaceCard>
      </ScreenShell>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ScreenShell
        subtitle="We couldn't load your account details."
        title="Profile"
      >
        <AppMessage
          message={getUserFriendlyApiErrorMessage(profileQuery.error)}
          tone="error"
        />
        <AppButton
          label="Try again"
          loading={profileQuery.isFetching}
          onPress={() => {
            void profileQuery.refetch();
          }}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      eyebrow="Account"
      showHeader={false}
      subtitle="Keep your ScholarTrend identity accurate and up to date."
      title="Profile"
    >
      <ProfileHeroCard profile={profileQuery.data} />
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.lg }}>
        <View
          style={{
            backgroundColor: theme.colors.outlineSoft,
            height: 1,
          }}
        />
        <Text
          selectable
          style={[
            theme.typography.label,
            {
              color: theme.colors.primary,
              fontSize: 15,
              fontWeight: "800",
            },
          ]}
        >
          Settings
        </Text>
        <ProfileSettingsList
          isLoggingOut={logoutMutation.isPending}
          onEditProfilePress={() => router.push("/profile/edit")}
          onLogoutPress={handleLogoutPress}
        />
      </View>
    </ScreenShell>
  );
}

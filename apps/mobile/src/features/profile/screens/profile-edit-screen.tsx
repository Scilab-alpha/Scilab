import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton, AppMessage } from "@/components/ui";
import { ScreenShell, SurfaceCard } from "@/components/layout/screen-shell";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useUpdateProfile } from "@/features/profile/hooks/use-update-profile";
import { getUserFriendlyApiErrorMessage } from "@/services/api";
import { useAppTheme } from "@/theme";

export function ProfileEditScreen() {
  const theme = useAppTheme();
  const profileQuery = useProfile();
  const updateMutation = useUpdateProfile();

  if (profileQuery.isPending) {
    return (
      <ScreenShell
        subtitle="Loading your editable profile details."
        title="Edit profile"
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
        subtitle="We couldn't load the profile editor."
        title="Edit profile"
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
      showHeader={false}
      subtitle="Edit profile"
      title="Edit profile"
    >
      <View style={[styles.content, { paddingTop: theme.spacing.lg }]}>
        <ProfileForm
          isSaving={updateMutation.isPending}
          onSubmit={(values) => updateMutation.mutate(values)}
          profile={profileQuery.data}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
});

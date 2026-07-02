import { StyleSheet, ScrollView, Text, View } from "react-native";

import { AppButton } from "@/components/ui";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { getRoleLabel, getRoleSummary } from "@/features/auth/utils/roles";
import { useAuthStore } from "@/store/auth.store";
import { useAppTheme } from "@/theme";

export function DiscoverScreen() {
  const theme = useAppTheme();
  const logoutMutation = useLogout();
  const user = useAuthStore((state) => state.user);
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Scholar";
  const roleLabel = getRoleLabel(user?.role);
  const roleSummary = getRoleSummary(user?.role);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        gap: theme.spacing.xl,
        justifyContent: "center",
        padding: theme.spacing.xxl,
      }}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
    >
      <View style={{ gap: theme.spacing.sm }}>
        <Text style={[theme.typography.display, { color: theme.colors.text }]}>
          Welcome, {displayName}
        </Text>
        <Text
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          Your authenticated research discovery workspace is ready.
        </Text>
      </View>

      <View
        style={[
          styles.profilePanel,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineSoft,
            borderRadius: theme.radii.md,
            gap: theme.spacing.sm,
          },
        ]}
      >
        <View style={{ gap: theme.spacing.xs }}>
          <Text
            style={[theme.typography.caption, { color: theme.colors.outline }]}
          >
            Signed in as
          </Text>
          <Text
            style={[theme.typography.heading, { color: theme.colors.text }]}
          >
            {user?.email ?? "Loading account..."}
          </Text>
        </View>

        <View
          style={[
            styles.roleBadge,
            {
              alignSelf: "flex-start",
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radii.sm,
            },
          ]}
        >
          <Text
            style={[theme.typography.label, { color: theme.colors.primary }]}
          >
            {roleLabel}
          </Text>
        </View>

        <Text
          style={[theme.typography.body, { color: theme.colors.textMuted }]}
        >
          {roleSummary}
        </Text>
      </View>

      <AppButton
        label="Sign out"
        loading={logoutMutation.isPending}
        onPress={() => {
          logoutMutation.mutate();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profilePanel: {
    borderWidth: 1,
    padding: 16,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});

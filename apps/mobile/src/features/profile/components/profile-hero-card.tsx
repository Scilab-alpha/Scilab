import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getRoleLabel } from "@/features/auth/utils/roles";
import { SurfaceCard } from "@/features/navigation/components/screen-shell";
import type { UserProfile } from "@/features/profile/types/profile.type";
import { useAppTheme } from "@/theme";

export function ProfileHeroCard({ profile }: { profile: UserProfile }) {
  const theme = useAppTheme();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Scholar";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const showImage =
    Boolean(profile.imageUrl) && failedImageUrl !== profile.imageUrl;

  return (
    <SurfaceCard>
      <View style={styles.header}>
        <View
          style={[styles.avatar, { backgroundColor: theme.colors.primarySoft }]}
        >
          {showImage ? (
            <Image
              accessibilityLabel={`${displayName}'s profile photo`}
              contentFit="cover"
              onError={() => setFailedImageUrl(profile.imageUrl)}
              source={profile.imageUrl ?? undefined}
              style={styles.avatarImage}
              transition={180}
            />
          ) : (
            <Text style={[styles.initials, { color: theme.colors.primary }]}>
              {initials}
            </Text>
          )}
        </View>

        <View style={styles.identity}>
          <Text
            selectable
            style={[styles.displayName, { color: theme.colors.text }]}
          >
            {displayName}
          </Text>
          <Text
            selectable
            numberOfLines={1}
            style={[styles.email, { color: theme.colors.textMuted }]}
          >
            {profile.email}
          </Text>
          <View style={styles.badges}>
            <ProfileBadge
              icon="school-outline"
              label={getRoleLabel(profile.role)}
            />
            <ProfileBadge
              icon="checkmark-circle-outline"
              label={formatStatus(profile.status)}
            />
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}

function ProfileBadge({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.primarySoft }]}>
      <Ionicons color={theme.colors.primary} name={icon} size={12} />
      <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
        {label}
      </Text>
    </View>
  );
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    overflow: "hidden",
    width: 72,
  },
  avatarImage: { height: "100%", width: "100%" },
  displayName: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  email: { fontSize: 13, lineHeight: 19 },
  header: { alignItems: "center", flexDirection: "row", gap: 16 },
  identity: { flex: 1, gap: 3 },
  initials: { fontSize: 23, fontWeight: "800" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: 5 },
  badge: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
});

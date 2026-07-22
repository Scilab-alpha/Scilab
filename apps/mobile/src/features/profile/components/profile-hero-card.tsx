import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getRoleLabel } from "@/features/auth/utils/roles";
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
    <View style={[styles.profile, { gap: theme.spacing.lg }]}>
      <View style={styles.summary}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.outlineSoft,
            },
          ]}
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

      <View
        style={[
          styles.details,
          {
            borderTopColor: theme.colors.outlineSoft,
            gap: theme.spacing.md,
            paddingTop: theme.spacing.md,
          },
        ]}
      >
        <View style={styles.infoRow}>
          <ProfileInfoItem label="First name" value={profile.firstName} />
          <ProfileInfoItem label="Last name" value={profile.lastName} />
        </View>
        <View style={styles.infoRow}>
          <ProfileInfoItem
            label="Gender"
            value={formatGender(profile.gender)}
          />
          <ProfileInfoItem
            label="Date of birth"
            value={formatDateOfBirth(profile.dateOfBirth)}
          />
        </View>
        <View style={styles.infoRow}>
          <ProfileInfoItem label="Role" value={getRoleLabel(profile.role)} />
          <ProfileInfoItem
            label="Status"
            value={formatStatus(profile.status)}
          />
        </View>
      </View>
    </View>
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

function ProfileInfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const theme = useAppTheme();
  const displayValue = value?.trim() ? value : "Not set";

  return (
    <View style={styles.infoItem}>
      <Text style={[theme.typography.caption, { color: theme.colors.outline }]}>
        {label}
      </Text>
      <Text selectable style={[styles.infoValue, { color: theme.colors.text }]}>
        {displayValue}
      </Text>
    </View>
  );
}

function formatGender(gender: UserProfile["gender"]) {
  if (!gender) {
    return null;
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

function formatDateOfBirth(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return null;
  }

  const parsedDate = new Date(dateOfBirth);

  if (Number.isNaN(parsedDate.getTime())) {
    return dateOfBirth;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    borderRadius: 44,
    borderWidth: 1,
    height: 88,
    justifyContent: "center",
    overflow: "hidden",
    width: 88,
  },
  avatarImage: { height: "100%", width: "100%" },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  email: { fontSize: 13, lineHeight: 19 },
  identity: { flex: 1, gap: 4 },
  initials: { fontSize: 23, fontWeight: "800" },
  details: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoItem: { flex: 1, gap: 3, minWidth: 0 },
  infoRow: {
    flexDirection: "row",
    gap: 16,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  profile: {},
  summary: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    paddingTop: 6,
  },
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
